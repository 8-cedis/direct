const { deleteById, filterCollection, findById, getNextSequence, listCollection, updateById, upsertById } = require("../database/localStore");

const mapOrder = (data) => ({
  id: data.id,
  user_id: data.user_id,
  customer_name: data.customer_name,
  phone: data.phone,
  address: data.address,
  total_price: data.total_price,
  status: data.status,
  fulfillment_status: data.fulfillment_status || "Confirmed",
  dispute_status: data.dispute_status || "none",
  dispute_note: data.dispute_note || "",
  created_at: data.created_at,
  updated_at: data.updated_at || null,
  cancellation_reason: data.cancellation_reason || "",
  cancelled_at: data.cancelled_at || null,
  cancelled_by: data.cancelled_by || null,
  payment_status: data.payment_status || "Paid",
  refund_total: Number(data.refund_total || 0),
  refunds: Array.isArray(data.refunds) ? data.refunds : [],
  items: Array.isArray(data.items) ? data.items : [],
  order_timeline: Array.isArray(data.order_timeline) ? data.order_timeline : [],
});

const updateOrderDocument = async (id, updater) => {
  const current = findById("orders", id);
  if (!current) {
    return null;
  }

  const next = updater(current);
  upsertById("orders", { ...current, ...next });
  return mapOrder({ ...current, ...next });
};

const appendTimelineEvent = (order, event) => {
  const history = Array.isArray(order.order_timeline) ? order.order_timeline : [];
  return [...history, event];
};

const createOrder = async ({ userId, customerName, phone, address, totalPrice, items }) => {
  const id = await getNextSequence("orders");
  const now = new Date().toISOString();
  const order = {
    id,
    user_id: userId ? Number(userId) : null,
    customer_name: customerName,
    phone,
    address,
    total_price: Number(totalPrice || 0),
    status: "pending",
    fulfillment_status: "Confirmed",
    dispute_status: "none",
    dispute_note: "",
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    created_at: now,
    updated_at: now,
    items: items.map((item) => ({
      product_id: item.productId || null,
      product_name: item.productName,
      quantity: Number(item.quantity),
      price: Number(item.price),
    })),
    order_timeline: [
      {
        at: now,
        type: "order_created",
        status: "pending",
        fulfillment_status: "Confirmed",
        actor: "system",
        note: "Order created",
      },
    ],
  };

  upsertById("orders", order);
  return { id };
};

const getOrderById = async (id) => {
  const order = findById("orders", id);
  return order ? mapOrder(order) : null;
};

const updateOrderPayment = async (id, { status, reference, receipt }) => {
  const existing = updateById("orders", id, {
    status,
    payment_reference: reference || null,
    receipt: receipt || null,
    updated_at: new Date().toISOString(),
  });

  if (!existing) {
    return false;
  }
  return true;
};

const getAllOrders = async () => {
  return listCollection("orders").map((order) => mapOrder(order));
};

const getOrdersByUserId = async (userId) => {
  return filterCollection(
    "orders",
    (order) => Number(order.user_id) === Number(userId),
    (left, right) => Number(right.id) - Number(left.id)
  ).map((order) => mapOrder(order));
};

const getOrdersWithDisputes = async () => {
  const allOrders = await getAllOrders();
  return allOrders.filter((order) => (order.dispute_status || "none") !== "none");
};

const updateOrderFulfillmentStatus = async (id, fulfillmentStatus) => {
  const next = await updateOrderDocument(id, (order) => {
    const now = new Date().toISOString();
    return {
      fulfillment_status: fulfillmentStatus,
      status: String(fulfillmentStatus || "").toLowerCase() === "delivered" ? "completed" : order.status,
      updated_at: now,
      order_timeline: appendTimelineEvent(order, {
        at: now,
        type: "fulfillment_status_updated",
        status: order.status,
        fulfillment_status: fulfillmentStatus,
        actor: "seller",
        note: `Fulfillment set to ${fulfillmentStatus}`,
      }),
    };
  });
  return Boolean(next);
};

const updateOrderDispute = async (id, disputeStatus, disputeNote) => {
  const next = await updateOrderDocument(id, (order) => {
    const now = new Date().toISOString();
    return {
      dispute_status: disputeStatus,
      dispute_note: disputeNote || "",
      updated_at: now,
      order_timeline: appendTimelineEvent(order, {
        at: now,
        type: "dispute_updated",
        status: order.status,
        fulfillment_status: order.fulfillment_status,
        actor: "admin",
        note: disputeNote || `Dispute status changed to ${disputeStatus}`,
        dispute_status: disputeStatus,
      }),
    };
  });
  return Boolean(next);
};

const adminUpdateOrderStatus = async (id, { status, fulfillmentStatus, note, actor = "admin" }) => {
  return updateOrderDocument(id, (order) => {
    const now = new Date().toISOString();
    const nextStatus = status || order.status;
    const nextFulfillment = fulfillmentStatus || order.fulfillment_status;
    return {
      status: nextStatus,
      fulfillment_status: nextFulfillment,
      updated_at: now,
      order_timeline: appendTimelineEvent(order, {
        at: now,
        type: "admin_status_update",
        status: nextStatus,
        fulfillment_status: nextFulfillment,
        actor,
        note: note || "Status updated by admin",
      }),
    };
  });
};

const issueOrderRefund = async (id, { amount, reason, actor = "admin" }) => {
  return updateOrderDocument(id, (order) => {
    const now = new Date().toISOString();
    const nextAmount = Number(amount || 0);
    const previousRefunds = Array.isArray(order.refunds) ? order.refunds : [];
    const nextRefundTotal = Number(order.refund_total || 0) + nextAmount;
    const totalPrice = Number(order.total_price || 0);

    return {
      refunds: [
        ...previousRefunds,
        {
          amount: nextAmount,
          reason: reason || "Refund issued by admin",
          at: now,
          actor,
          type: nextAmount >= totalPrice ? "full" : "partial",
        },
      ],
      refund_total: Number(nextRefundTotal.toFixed(2)),
      payment_status: nextRefundTotal >= totalPrice ? "Refunded" : "Partially Refunded",
      updated_at: now,
      order_timeline: appendTimelineEvent(order, {
        at: now,
        type: "refund_issued",
        status: order.status,
        fulfillment_status: order.fulfillment_status,
        actor,
        note: reason || "Refund issued",
        refund_amount: Number(nextAmount.toFixed(2)),
      }),
    };
  });
};

const cancelOrderByAdmin = async (id, { reason, actor = "admin" }) => {
  return updateOrderDocument(id, (order) => {
    const now = new Date().toISOString();
    return {
      status: "cancelled",
      fulfillment_status: "Cancelled",
      cancellation_reason: reason || "Cancelled by admin",
      cancelled_at: now,
      cancelled_by: actor,
      updated_at: now,
      order_timeline: appendTimelineEvent(order, {
        at: now,
        type: "order_cancelled",
        status: "cancelled",
        fulfillment_status: "Cancelled",
        actor,
        note: reason || "Order cancelled by admin",
      }),
    };
  });
};

const getOrderTimeline = async (id) => {
  const order = await getOrderById(id);
  if (!order) {
    return null;
  }

  return Array.isArray(order.order_timeline) ? order.order_timeline : [];
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderPayment,
  getAllOrders,
  getOrdersByUserId,
  getOrdersWithDisputes,
  updateOrderFulfillmentStatus,
  updateOrderDispute,
  adminUpdateOrderStatus,
  issueOrderRefund,
  cancelOrderByAdmin,
  getOrderTimeline,
};
