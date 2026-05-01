/**
 * Finance Service - Payouts, refunds, and financial reporting
 */
import { ordersRepository, farmersRepository } from "../lib/supabaseData";

export async function getFinanceAnalytics(range = "30d") {
  try {
    const { orders } = await ordersRepository.getList({}, 1000);

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "30d") startDate.setDate(now.getDate() - 30);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date("2020-01-01");

    const filteredOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startDate && o.paymentStatus === "paid"
    );

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const platformCommissionRate = 0.1; // 10%
    const platformCommission = totalRevenue * platformCommissionRate;
    const farmerPayouts = totalRevenue - platformCommission;

    // Breakdown by payment method
    const paymentMethods = {};
    filteredOrders.forEach((order) => {
      const method = order.paymentMethod || "unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Daily transaction volume
    const transactionSeries = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      transactionSeries[date] = (transactionSeries[date] || 0) + 1;
    });

    return {
      totalRevenue,
      platformCommission,
      farmerPayouts,
      totalTransactions: filteredOrders.length,
      paymentMethods,
      transactionSeries: Object.entries(transactionSeries).map(([date, count]) => ({
        date,
        transactions: count,
      })),
    };
  } catch (err) {
    console.error("Failed to get finance analytics:", err);
    throw err;
  }
}

export async function getFarmerPayouts(pageSize = 50, lastDoc = null) {
  try {
    return await farmersRepository.getList(pageSize, lastDoc);
  } catch (err) {
    console.error("Failed to get farmer payouts:", err);
    throw err;
  }
}

export async function updateFarmerPayout(farmerId, amount, status = "pending") {
  try {
    const farmer = await farmersRepository.getById(farmerId);
    if (!farmer) throw new Error("Farmer not found");

    const lastPayoutDate = new Date().toISOString();

    await farmersRepository.update(farmerId, {
      lastPayoutAmount: amount,
      lastPayoutDate,
      payoutStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to update farmer payout:", err);
    throw err;
  }
}

export async function processBulkPayouts(farmerIds, amount) {
  try {
    const updates = farmerIds.map((id) => ({
      id,
      lastPayoutAmount: amount,
      lastPayoutDate: new Date().toISOString(),
      payoutStatus: "processed",
    }));

    for (const update of updates) {
      await farmersRepository.update(update.id, update);
    }

    return {
      processedCount: updates.length,
      totalAmount: amount * updates.length,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to process bulk payouts:", err);
    throw err;
  }
}

export async function getRefundAnalytics(range = "30d") {
  try {
    const { orders } = await ordersRepository.getList({}, 1000);

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "30d") startDate.setDate(now.getDate() - 30);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date("2020-01-01");

    const refundedOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= startDate &&
        (o.paymentStatus === "refunded" || o.paymentStatus === "partially_refunded")
    );

    const totalRefunded = refundedOrders.reduce((sum, o) => sum + o.refundTotal, 0);
    const refundCount = refundedOrders.length;
    const avgRefundAmount = refundCount > 0 ? totalRefunded / refundCount : 0;

    const refundReasons = {};
    refundedOrders.forEach((order) => {
      // Extract reason from notes if available
      const reason = order.notes?.includes("Refund") ? "Customer Request" : "Other";
      refundReasons[reason] = (refundReasons[reason] || 0) + 1;
    });

    return {
      totalRefunded,
      refundCount,
      avgRefundAmount,
      refundRate: refundCount > 0 ? (refundCount / orders.length) * 100 : 0,
      refundReasons,
    };
  } catch (err) {
    console.error("Failed to get refund analytics:", err);
    throw err;
  }
}
