const crypto = require("crypto");
const { getOrderById, updateOrderPayment } = require("../models/orderModel");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const isPaystackLiveEnabled = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

const paystackRequest = async (path, options = {}) => {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok || data.status === false) {
    throw new Error(data.message || "Paystack request failed");
  }
  return data;
};

const buildReceipt = (order, paymentReference, paymentMethod) => ({
  receiptNo: `RCPT-${order.id}-${Date.now()}`,
  orderId: order.id,
  customerName: order.customer_name,
  items: order.items || [],
  total: order.total_price,
  paymentMethod,
  paymentReference,
  issuedAt: new Date().toISOString(),
});

const initializePayment = async (req, res) => {
  try {
    const { orderId, email, amount, method = "card" } = req.body;
    if (!orderId || !email || !amount) {
      return res.status(400).json({ message: "orderId, email, and amount are required" });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const amountInKobo = Math.round(Number(amount) * 100);
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || "http://localhost:3000/checkout/success";

    if (isPaystackLiveEnabled()) {
      const response = await paystackRequest("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          callback_url: callbackUrl,
          metadata: { orderId: Number(orderId), method },
        }),
      });

      return res.status(201).json({
        message: "Payment initialized",
        payment: {
          orderId,
          amount,
          method,
          authorizationUrl: response.data.authorization_url,
          accessCode: response.data.access_code,
          reference: response.data.reference,
          status: "pending",
        },
      });
    }

    const reference = `SIM-${Date.now()}`;
    return res.status(201).json({
      message: "Payment initialized (simulated)",
      payment: {
        orderId,
        amount,
        method,
        authorizationUrl: `${callbackUrl}?reference=${reference}&orderId=${orderId}`,
        accessCode: `SIM-CODE-${Date.now()}`,
        reference,
        status: "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to initialize payment", error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const reference = req.params.reference;
    const orderId = Number(req.query.orderId || req.body.orderId);
    if (!reference || !orderId) {
      return res.status(400).json({ message: "reference and orderId are required" });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let paid = false;
    let paymentMethod = "card";

    if (isPaystackLiveEnabled() && !reference.startsWith("SIM-")) {
      const response = await paystackRequest(`/transaction/verify/${reference}`, {
        method: "GET",
      });
      paid = response.data.status === "success";
      paymentMethod = response.data.channel || "card";
    } else {
      paid = true;
      paymentMethod = "mobile_money_or_card";
    }

    const status = paid ? "paid" : "payment_failed";
    const receipt = paid ? buildReceipt(order, reference, paymentMethod) : null;
    await updateOrderPayment(orderId, { status, reference, receipt });

    return res.json({
      message: paid ? "Payment verified" : "Payment verification failed",
      orderId,
      reference,
      status,
      receipt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const rawBody = req.body;

    if (!secret || !Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ message: "Invalid webhook setup" });
    }

    const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    if (event.event !== "charge.success") {
      return res.json({ message: "Event ignored" });
    }

    const reference = event.data.reference;
    const orderId = Number(event.data.metadata?.orderId);
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const receipt = buildReceipt(order, reference, event.data.channel || "card");
    await updateOrderPayment(orderId, { status: "paid", reference, receipt });

    return res.json({ message: "Webhook processed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed webhook processing", error: error.message });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  paystackWebhook,
};
