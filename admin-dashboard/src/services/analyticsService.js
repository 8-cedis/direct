/**
 * Analytics Service - Dashboard analytics and key metrics
 */
import { ordersRepository, customersRepository, productsRepository, farmersRepository } from "../lib/supabaseData";
import { orders as demoOrders } from "../data/orders";
import { customers as demoCustomers } from "../data/customers";
import { products as demoProducts } from "../data/products";
import { farmers as demoFarmers } from "../data/farmers";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRangeStart = (range) => {
  const now = new Date();
  const startDate = new Date();
  if (range === "7d") startDate.setDate(now.getDate() - 7);
  else if (range === "30d") startDate.setDate(now.getDate() - 30);
  else if (range === "90d") startDate.setDate(now.getDate() - 90);
  else return new Date("2020-01-01");
  return startDate;
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("deliver")) return "delivered";
  if (value.includes("ship") || value.includes("out for delivery")) return "shipped";
  if (value.includes("confirm")) return "confirmed";
  if (value.includes("process")) return "processing";
  return "pending";
};

const normalizeDemoOrders = () =>
  demoOrders.map((order) => ({
    id: order.id,
    orderId: order.id,
    customerName: order.customerName,
    totalPrice: Number(order.totalAmount || 0),
    createdAt: order.placedAt,
    status: normalizeStatus(order.status),
    paymentStatus: String(order.paymentStatus || "paid").toLowerCase(),
    items: (order.items || []).map((item) => ({
      productName: item.name,
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.price || 0) * Number(item.quantity || 1),
    })),
  }));

const buildDemoAnalytics = (range = "30d") => {
  const orders = normalizeDemoOrders();
  const customers = demoCustomers.map((customer, index) => ({
    ...customer,
    createdAt: customer.memberSince || new Date(2026, index % 12, 1).toISOString(),
  }));
  const products = demoProducts.map((product, index) => ({
    ...product,
    status: String(product.status || "Active").toLowerCase(),
    createdAt: new Date(2026, 2, 1 + index).toISOString(),
    category: String(product.category || "Vegetables").toLowerCase(),
  }));
  const farmers = demoFarmers;

  const startDate = getRangeStart(range);
  const filteredOrders = orders.filter((order) => new Date(order.createdAt) >= startDate);
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + toNumber(order.totalPrice), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByStatus = {
    pending: filteredOrders.filter((order) => order.status === "pending").length,
    processing: filteredOrders.filter((order) => order.status === "processing").length,
    shipped: filteredOrders.filter((order) => order.status === "shipped").length,
    delivered: filteredOrders.filter((order) => order.status === "delivered").length,
    cancelled: filteredOrders.filter((order) => order.status === "cancelled").length,
  };

  const productRevenue = {};
  filteredOrders.forEach((order) => {
    order.items?.forEach((item) => {
      const key = item.productName || "Unknown";
      productRevenue[key] = (productRevenue[key] || 0) + toNumber(item.subtotal);
    });
  });

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, revenue], index) => ({
      rank: index + 1,
      name,
      revenue,
      unitsSold: filteredOrders.reduce(
        (sum, order) => sum + (order.items || []).filter((item) => item.productName === name).reduce((itemSum, item) => itemSum + toNumber(item.quantity), 0),
        0
      ),
      orderCount: filteredOrders.filter((order) => (order.items || []).some((item) => item.productName === name)).length,
    }));

  const topFarmers = farmers
    .sort((a, b) => (b.totalValueSupplied || 0) - (a.totalValueSupplied || 0))
    .slice(0, 10)
    .map((farmer, index) => ({
      id: farmer.id,
      rank: index + 1,
      sellerName: farmer.farmName || farmer.name,
      revenue: toNumber(farmer.totalValueSupplied),
      unitsSold: toNumber(farmer.totalBatches),
      listedProducts: products.filter((product) => String(product.farm || product.farmName || "").includes(farmer.farmName || farmer.name)).length,
    }));

  const revenueSeries = {};
  filteredOrders.forEach((order) => {
    const date = new Date(order.createdAt).toISOString().split("T")[0];
    revenueSeries[date] = (revenueSeries[date] || 0) + toNumber(order.totalPrice);
  });

  const newCustomersThisMonth = customers.filter((customer) => new Date(customer.createdAt) >= startDate).length;
  const returnedOrders = filteredOrders.filter((order) => order.paymentStatus === "refunded" || order.paymentStatus === "partially_refunded");
  const returnRate = totalOrders > 0 ? (returnedOrders.length / totalOrders) * 100 : 0;

  return {
    statCards: [
      { label: "Revenue", value: `GHS ${totalRevenue.toLocaleString()}` },
      { label: "Orders", value: totalOrders },
      { label: "Customers", value: customers.length },
      { label: "Active Products", value: products.filter((product) => product.status === "active").length },
    ],
    rangeDays: Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24))),
    ordersByStatus,
    topProducts,
    topFarmers,
    topSellers: topFarmers,
    revenueSeries: Object.entries(revenueSeries).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date)),
    salesBreakdown: [
      { name: "Vegetables", value: products.filter((product) => product.category === "vegetables").length, color: "#3B6D11" },
      { name: "Fruits", value: products.filter((product) => product.category === "fruits").length, color: "#E48B2A" },
      { name: "Grains", value: products.filter((product) => product.category === "grains").length, color: "#8B5E34" },
      { name: "Other", value: products.filter((product) => !["vegetables", "fruits", "grains"].includes(product.category)).length, color: "#667085" },
    ].filter((entry) => entry.value > 0),
    revenueComparison: [
      { period: "Revenue", current: totalRevenue, previous: 0 },
      { period: "Orders", current: totalOrders, previous: 0 },
    ],
    activityFeed: [
      ...filteredOrders.slice(0, 6).map((order) => ({
        id: `order-${order.id}`,
        kind: "order",
        action: `Order ${order.orderId || order.id}`,
        detail: `${order.customerName || "Customer"} placed an order worth GHS ${toNumber(order.totalPrice).toFixed(2)}`,
        timestamp: order.createdAt,
        tone: "success",
      })),
      ...customers.slice(0, 4).map((customer) => ({
        id: `customer-${customer.id}`,
        kind: "customer",
        action: "New customer registered",
        detail: `${customer.name} joined with ${customer.email}`,
        timestamp: customer.createdAt,
        tone: "info",
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10),
    platformHealth: {
      uptimeSeconds: 0,
      activeSessions: customers.length,
      errorRate: 0,
      unresolvedDisputes: orders.filter((order) => order.status !== "delivered" && order.status !== "pending").length,
      unresolvedComplaints: 0,
      checkedAt: new Date().toISOString(),
    },
    metrics: {
      returnRate,
      fulfillmentRate: 100 - returnRate,
      avgCustomerValue: customers.length > 0 ? totalRevenue / customers.length : 0,
    },
  };
};

export async function getDashboardAnalytics(range = "30d") {
  try {
    const [ordersData, customersData, products, farmersData] = await Promise.all([
      ordersRepository.getList({}, 1000),
      customersRepository.getList(1000),
      productsRepository.getList(),
      farmersRepository.getList(1000),
    ]);

    const orders = ordersData.orders || [];
    const customers = customersData.customers || [];
    const farmers = farmersData.farmers || [];

    if (orders.length === 0 && customers.length === 0 && products.length === 0 && farmers.length === 0) {
      return buildDemoAnalytics(range);
    }

    const now = new Date();
    const startDate = getRangeStart(range);

    const filteredOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startDate
    );

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + toNumber(o.totalPrice), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus = {
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      processing: filteredOrders.filter((o) => o.status === "processing").length,
      shipped: filteredOrders.filter((o) => o.status === "shipped").length,
      delivered: filteredOrders.filter((o) => o.status === "delivered").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    };

    // Top products
    const productRevenue = {};
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.productName || "Unknown";
        productRevenue[key] = (productRevenue[key] || 0) + toNumber(item.subtotal);
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, revenue], index) => ({
        rank: index + 1,
        name,
        revenue,
        unitsSold: filteredOrders.reduce(
          (sum, order) => sum + (order.items || []).filter((item) => item.productName === name).reduce((itemSum, item) => itemSum + toNumber(item.quantity), 0),
          0
        ),
        orderCount: filteredOrders.filter((order) => (order.items || []).some((item) => item.productName === name)).length,
      }));

    // Top sellers (farmers)
    const topFarmers = farmers
      .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
      .slice(0, 10)
      .map((farmer, index) => ({
        id: farmer.id,
        rank: index + 1,
        sellerName: farmer.farmName || farmer.name,
        revenue: toNumber(farmer.totalEarnings ?? farmer.totalValueSupplied),
        unitsSold: toNumber(farmer.productsSupplied),
        listedProducts: products.filter((product) => product.farmName === farmer.farmName).length,
      }));

    // Revenue trend by day
    const revenueSeries = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      revenueSeries[date] = (revenueSeries[date] || 0) + toNumber(order.totalPrice);
    });

    // Activity metrics
    const newCustomersThisMonth = customers.filter((c) =>
      new Date(c.createdAt) >= startDate
    ).length;

    // Return rate
    const returnedOrders = filteredOrders.filter(
      (o) => o.paymentStatus === "refunded" || o.paymentStatus === "partially_refunded"
    );
    const returnRate = totalOrders > 0 ? (returnedOrders.length / totalOrders) * 100 : 0;

    return {
      statCards: [
        { label: "Revenue", value: `GHS ${totalRevenue.toLocaleString()}` },
        { label: "Orders", value: totalOrders },
        { label: "Customers", value: customers.length },
        { label: "Active Products", value: products.filter((p) => p.status === "active").length },
      ],
      rangeDays: Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))),
      ordersByStatus,
      topProducts,
      topFarmers,
      topSellers: topFarmers,
      revenueSeries: Object.entries(revenueSeries)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      salesBreakdown: [
        { name: "Vegetables", value: products.filter((p) => p.category === "vegetables").length, color: "#3B6D11" },
        { name: "Fruits", value: products.filter((p) => p.category === "fruits").length, color: "#E48B2A" },
        { name: "Grains", value: products.filter((p) => p.category === "grains").length, color: "#8B5E34" },
        { name: "Other", value: products.filter((p) => !["vegetables", "fruits", "grains"].includes(p.category)).length, color: "#667085" },
      ].filter((entry) => entry.value > 0),
      revenueComparison: [
        { period: "Revenue", current: totalRevenue, previous: 0 },
        { period: "Orders", current: totalOrders, previous: 0 },
      ],
      activityFeed: [
        ...filteredOrders.slice(0, 6).map((order) => ({
          id: `order-${order.id}`,
          kind: "order",
          action: `Order ${order.orderId || order.id}`,
          detail: `${order.customerName || "Customer"} placed an order worth GHS ${toNumber(order.totalPrice).toFixed(2)}`,
          timestamp: order.createdAt,
          tone: "success",
        })),
        ...customers.slice(0, 4).map((customer) => ({
          id: `customer-${customer.id}`,
          kind: "customer",
          action: "New customer registered",
          detail: `${customer.name} joined with ${customer.email}`,
          timestamp: customer.createdAt,
          tone: "info",
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10),
      platformHealth: {
        uptimeSeconds: 0,
        activeSessions: customers.length,
        errorRate: 0,
        unresolvedDisputes: orders.filter((order) => order.dispute_status && order.dispute_status !== "none").length,
        unresolvedComplaints: 0,
        checkedAt: new Date().toISOString(),
      },
      metrics: {
        returnRate,
        fulfillmentRate: 100 - returnRate,
        avgCustomerValue: customers.length > 0
          ? filteredOrders.reduce((sum, o) => sum + toNumber(o.totalPrice), 0) / customers.length
          : 0,
      },
    };
  } catch (err) {
    return buildDemoAnalytics(range);
  }
}

export async function getHealthMetrics() {
  try {
    const [ordersData, customersData, products] = await Promise.all([
      ordersRepository.getList({}, 1000),
      customersRepository.getList(1000),
      productsRepository.getList(),
    ]);

    const orders = ordersData.orders || [];
    const customers = customersData.customers || [];

    // Check order fulfillment health
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const overdueOrders = pendingOrders.filter((o) => {
      const daysSincePending = (new Date() - new Date(o.createdAt)) / (1000 * 60 * 60 * 24);
      return daysSincePending > 3;
    });

    // Check inventory health
    const outOfStock = products.filter((p) => p.stock === 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 20);

    // Customer health
    const inactiveCustomers = customers.filter((c) => {
      const daysSinceOrder = c.lastOrderAt
        ? (new Date() - new Date(c.lastOrderAt)) / (1000 * 60 * 60 * 24)
        : 999;
      return daysSinceOrder > 90;
    });

    const health = {
      status: "healthy",
      score: 100,
      issues: [],
    };

    if (overdueOrders.length > 0) {
      health.issues.push({
        type: "overdue_orders",
        count: overdueOrders.length,
        severity: "medium",
      });
      health.score -= 10;
    }

    if (outOfStock.length > 0) {
      health.issues.push({
        type: "out_of_stock",
        count: outOfStock.length,
        severity: overdueOrders.length > 5 ? "high" : "low",
      });
      health.score -= 5;
    }

    if (lowStock.length > 10) {
      health.issues.push({
        type: "low_stock",
        count: lowStock.length,
        severity: "low",
      });
      health.score -= 5;
    }

    if (inactiveCustomers.length > customers.length * 0.3) {
      health.issues.push({
        type: "inactive_customers",
        count: inactiveCustomers.length,
        severity: "low",
      });
      health.score -= 5;
    }

    if (health.score >= 80) health.status = "healthy";
    else if (health.score >= 50) health.status = "warning";
    else health.status = "critical";

    return health;
  } catch (err) {
    console.error("Failed to get health metrics:", err);
    throw err;
  }
}

export async function getActivityFeed(limit = 10) {
  try {
    const [ordersData, customersData] = await Promise.all([
      ordersRepository.getList({}, limit * 2),
      customersRepository.getList(limit * 2),
    ]);

    const orders = ordersData.orders || [];
    const customers = customersData.customers || [];

    const activities = [];

    // Recent orders
    orders.slice(0, limit).forEach((order) => {
      activities.push({
        type: "order",
        action: `New order from ${order.customerName}`,
        value: `₹${order.totalPrice.toFixed(2)}`,
        timestamp: order.createdAt,
      });
    });

    // Recent customers
    customers.slice(0, limit / 2).forEach((customer) => {
      activities.push({
        type: "customer",
        action: `New customer: ${customer.name}`,
        value: "New",
        timestamp: customer.createdAt,
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (err) {
    console.error("Failed to get activity feed:", err);
    throw err;
  }
}
