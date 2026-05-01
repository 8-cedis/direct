/**
 * Reports Service - Generate business intelligence and analytics
 */
import { ordersRepository, customersRepository, productsRepository, farmersRepository } from "../lib/supabaseData";

export async function generateSalesReport(range = "30d") {
  try {
    const { orders } = await ordersRepository.getList({}, 1000);
    const { customers } = await customersRepository.getList(1000);

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "30d") startDate.setDate(now.getDate() - 30);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date("2020-01-01");

    const filteredOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startDate
    );

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = filteredOrders.length;
    const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerName)).size;

    // Top products by revenue
    const productRevenue = {};
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.productName || "Unknown";
        productRevenue[key] = (productRevenue[key] || 0) + item.subtotal;
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue }));

    // Daily sales trend
    const dailySales = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      dailySales[date] = (dailySales[date] || 0) + 1;
    });

    return {
      period: range,
      totalRevenue,
      totalOrders,
      uniqueCustomers,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topProducts,
      dailySales: Object.entries(dailySales).map(([date, count]) => ({ date, orders: count })),
    };
  } catch (err) {
    console.error("Failed to generate sales report:", err);
    throw err;
  }
}

export async function generateInventoryReport() {
  try {
    const products = await productsRepository.getList();

    const lowStockItems = products.filter((p) => p.stock < 20);
    const outOfStock = products.filter((p) => p.stock === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const byCategory = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, value: 0 };
      }
      byCategory[cat].count += 1;
      byCategory[cat].value += p.price * p.stock;
    });

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      totalInventoryValue: totalValue,
      lowStockItems: lowStockItems.slice(0, 20),
      byCategory,
    };
  } catch (err) {
    console.error("Failed to generate inventory report:", err);
    throw err;
  }
}

export async function generateFarmerReport() {
  try {
    const { farmers } = await farmersRepository.getList(1000);

    const totalFarmers = farmers.length;
    const activeFarmers = farmers.filter((f) => f.totalProducts > 0).length;
    const totalEarnings = farmers.reduce((sum, f) => sum + (f.totalEarnings || 0), 0);

    const topFarmers = farmers
      .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
      .slice(0, 10);

    const earningsDistribution = {};
    farmers.forEach((f) => {
      const bracket = Math.floor((f.totalEarnings || 0) / 1000) * 1000;
      earningsDistribution[bracket] = (earningsDistribution[bracket] || 0) + 1;
    });

    return {
      totalFarmers,
      activeFarmers,
      totalEarnings,
      avgEarningsPerFarmer: totalFarmers > 0 ? totalEarnings / totalFarmers : 0,
      topFarmers,
      earningsDistribution,
    };
  } catch (err) {
    console.error("Failed to generate farmer report:", err);
    throw err;
  }
}

export async function generateOperationalMetrics() {
  try {
    const { orders } = await ordersRepository.getList({}, 1000);
    const { customers } = await customersRepository.getList(1000);
    const products = await productsRepository.getList();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's metrics
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= today
    );

    // This month's metrics
    const monthOrders = orders.filter(
      (o) => new Date(o.createdAt) >= thisMonth
    );

    // Fulfillment rate
    const deliveredOrders = monthOrders.filter((o) => o.status === "delivered");
    const fulfillmentRate = monthOrders.length > 0
      ? (deliveredOrders.length / monthOrders.length) * 100
      : 0;

    // Return/Refund rate
    const refundedOrders = monthOrders.filter(
      (o) => o.paymentStatus === "refunded" || o.paymentStatus === "partially_refunded"
    );
    const refundRate = monthOrders.length > 0
      ? (refundedOrders.length / monthOrders.length) * 100
      : 0;

    return {
      todayOrders: todayOrders.length,
      monthOrders: monthOrders.length,
      fulfillmentRate,
      refundRate,
      avgInventoryTurnover: products.length > 0 ? monthOrders.length / products.length : 0,
      newCustomersThisMonth: customers.filter((c) => new Date(c.createdAt) >= thisMonth).length,
    };
  } catch (err) {
    console.error("Failed to generate operational metrics:", err);
    throw err;
  }
}
