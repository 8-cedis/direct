const { getAllUsers } = require("../models/userModel");
const { getAllProducts } = require("../models/productModel");
const { getAllOrders } = require("../models/orderModel");
const { listComplaints } = require("../models/crmModel");

const SALES_CATEGORIES = ["Animals", "Produce", "Materials", "Others"];
const CATEGORY_COLORS = {
  Animals: "#B54708",
  Produce: "#3B6D11",
  Materials: "#175CD3",
  Others: "#667085",
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

const getRangeConfig = (range, orders = []) => {
  const normalized = Object.prototype.hasOwnProperty.call(RANGE_DAYS, range) ? range : "30d";
  const dayCount = RANGE_DAYS[normalized];

  const today = startOfDay(new Date());
  const latestEnd = addDays(today, 1);

  if (dayCount === null) {
    const timestamps = orders.map((order) => new Date(order.created_at).getTime()).filter((value) => Number.isFinite(value));
    const earliest = timestamps.length ? new Date(Math.min(...timestamps)) : addDays(today, -89);
    return {
      range: normalized,
      currentStart: startOfDay(earliest),
      currentEnd: latestEnd,
      previousStart: addDays(startOfDay(earliest), -(latestEnd.getTime() - startOfDay(earliest).getTime()) / 86400000),
      previousEnd: startOfDay(earliest),
      dayCount: Math.max(1, Math.ceil((latestEnd.getTime() - startOfDay(earliest).getTime()) / 86400000)),
    };
  }

  const currentStart = addDays(today, -(dayCount - 1));
  return {
    range: normalized,
    currentStart,
    currentEnd: latestEnd,
    previousStart: addDays(currentStart, -dayCount),
    previousEnd: currentStart,
    dayCount,
  };
};

const calculatePercentChange = (current, previous) => {
  if (!previous) {
    return 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const isWithinRange = (value, from, to) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp >= from.getTime() && timestamp < to.getTime();
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const classifyProductCategory = (name = "", category = "") => {
  const source = `${String(name)} ${String(category)}`.toLowerCase();

  if (/(goat|cow|cattle|sheep|chicken|hen|egg|fish|poultry|livestock|animal)/.test(source)) {
    return "Animals";
  }

  if (/(fertilizer|feed|seed|crate|bag|tool|material|equipment|packaging)/.test(source)) {
    return "Materials";
  }

  if (/(fruit|vegetable|produce|grain|crop|plantain|rice|tomato|pepper|yam|cassava|okra|oats)/.test(source)) {
    return "Produce";
  }

  return "Others";
};

const getSellerNameFromProduct = (product) => {
  if (!product) {
    return "FarmDirect Marketplace";
  }

  const candidate =
    product.seller_name ||
    product.sellerName ||
    product.seller?.name ||
    product.farm ||
    product.farm_name ||
    product.farmer_name ||
    product.owner_name;

  return candidate ? String(candidate) : "FarmDirect Marketplace";
};

const getWindowStats = (items, field = "created_at", currentStart, currentEnd, previousStart, previousEnd) => {
  if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
    return { currentCount: 0, previousCount: 0 };
  }

  const currentCount = items.filter((item) => isWithinRange(item[field], currentStart, currentEnd)).length;
  const previousCount = items.filter((item) => isWithinRange(item[field], previousStart, previousEnd)).length;

  return { currentCount, previousCount };
};

const getProductActivityCounts = (products, currentStart, currentEnd, previousStart, previousEnd) => {
  if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
    return { currentActive: 0, previousActive: 0 };
  }

  const currentActive = products.filter(
    (product) => (product.approval_status || "approved") !== "rejected" && isWithinRange(product.created_at, currentStart, currentEnd)
  ).length;

  const previousActive = products.filter(
    (product) => (product.approval_status || "approved") !== "rejected" && isWithinRange(product.created_at, previousStart, previousEnd)
  ).length;

  return {
    currentActive,
    previousActive: previousActive || currentActive,
  };
};

const buildDailyRevenueSeries = (orders, start, end) => {
  const buckets = new Map();

  for (let day = new Date(start); day < end; day = addDays(day, 1)) {
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  orders.forEach((order) => {
    if (!isWithinRange(order.created_at, start, end)) {
      return;
    }

    const key = new Date(order.created_at).toISOString().slice(0, 10);
    buckets.set(key, toNumber(buckets.get(key)) + toNumber(order.total_price));
  });

  return Array.from(buckets.entries()).map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2)),
  }));
};

const buildSalesBreakdown = (orders, productsById) => {
  const categoryTotals = SALES_CATEGORIES.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const product = productsById.get(String(item.product_id || ""));
      const category = classifyProductCategory(item.product_name || product?.name, product?.category);
      const revenue = toNumber(item.price) * Math.max(toNumber(item.quantity), 1);
      categoryTotals[category] += revenue;
    });
  });

  return SALES_CATEGORIES.map((name) => ({
    name,
    value: Number(categoryTotals[name].toFixed(2)),
    color: CATEGORY_COLORS[name],
  }));
};

const buildRevenueComparison = (orders, currentStart, currentEnd, previousStart, previousEnd) => {
  const currentRangeRevenue = orders
    .filter((order) => isWithinRange(order.created_at, currentStart, currentEnd))
    .reduce((sum, order) => sum + toNumber(order.total_price), 0);

  const previousRangeRevenue = orders
    .filter((order) => isWithinRange(order.created_at, previousStart, previousEnd))
    .reduce((sum, order) => sum + toNumber(order.total_price), 0);

  return [
    {
      period: "Selected range",
      current: Number(currentRangeRevenue.toFixed(2)),
      previous: Number(previousRangeRevenue.toFixed(2)),
    },
  ];
};

const buildTopProducts = (orders, productsById) => {
  const aggregate = new Map();

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const id = String(item.product_id || item.product_name || "unknown");
      const product = productsById.get(String(item.product_id || ""));
      const name = item.product_name || product?.name || "Unnamed product";
      const quantity = Math.max(toNumber(item.quantity), 1);
      const revenue = toNumber(item.price) * quantity;

      const current =
        aggregate.get(id) ||
        {
          id,
          name,
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
        };

      current.unitsSold += quantity;
      current.revenue += revenue;
      current.orderCount += 1;
      aggregate.set(id, current);
    });
  });

  return Array.from(aggregate.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10)
    .map((item, index) => ({
      id: item.id,
      rank: index + 1,
      name: item.name,
      unitsSold: item.unitsSold,
      orderCount: item.orderCount,
      revenue: Number(item.revenue.toFixed(2)),
    }));
};

const buildTopSellers = (orders, productsById) => {
  const aggregate = new Map();

  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const product = productsById.get(String(item.product_id || ""));
      const sellerName = getSellerNameFromProduct(product);
      const quantity = Math.max(toNumber(item.quantity), 1);
      const revenue = toNumber(item.price) * quantity;

      const current =
        aggregate.get(sellerName) ||
        {
          id: sellerName,
          sellerName,
          revenue: 0,
          unitsSold: 0,
          listedProducts: new Set(),
        };

      current.revenue += revenue;
      current.unitsSold += quantity;
      if (product?.id !== undefined && product?.id !== null) {
        current.listedProducts.add(String(product.id));
      }

      aggregate.set(sellerName, current);
    });
  });

  return Array.from(aggregate.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((item, index) => ({
      id: item.id,
      rank: index + 1,
      sellerName: item.sellerName,
      revenue: Number(item.revenue.toFixed(2)),
      unitsSold: item.unitsSold,
      listedProducts: item.listedProducts.size,
    }));
};

const buildActivityFeed = (orders, users, complaints) => {
  const orderActivities = orders.map((order) => ({
    id: `order-${order.id}`,
    kind: "order",
    timestamp: order.created_at,
    action: `Order #${order.id} created`,
    detail: `${order.customer_name || "Customer"} placed ${formatCurrency(order.total_price)} (${order.fulfillment_status || "Confirmed"}).`,
    tone: "info",
  }));

  const userActivities = users.map((user) => ({
    id: `user-${user.id}`,
    kind: "user",
    timestamp: user.created_at,
    action: "New user registered",
    detail: `${user.name || "User"} joined with role ${user.role || "buyer"}.`,
    tone: "success",
  }));

  const complaintActivities = complaints.map((complaint) => ({
    id: `complaint-${complaint.id}`,
    kind: "complaint",
    entityId: complaint.id,
    timestamp: complaint.updated_at || complaint.created_at,
    action: `CRM complaint ${complaint.status || "open"}`,
    detail: `${complaint.user_name || "Customer"}: ${complaint.subject || "General issue"}`,
    tone:
      complaint.status === "resolved"
        ? "success"
        : complaint.status === "rejected"
          ? "danger"
          : "warning",
  }));

  return [...orderActivities, ...userActivities, ...complaintActivities]
    .filter((entry) => entry.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
};

const buildPlatformHealth = (users, orders, complaints) => {
  const recentOrders = orders.filter((order) => {
    const timestamp = new Date(order.created_at).getTime();
    return Number.isFinite(timestamp) && Date.now() - timestamp <= 24 * 60 * 60 * 1000;
  });

  const activeSessions = new Set(
    recentOrders.map((order) => Number(order.user_id)).filter((value) => Number.isFinite(value) && value > 0)
  ).size;

  const unresolvedDisputes = orders.filter((order) => {
    const status = String(order.dispute_status || "none").toLowerCase();
    return status !== "none" && status !== "resolved";
  }).length;

  const unresolvedComplaints = complaints.filter((complaint) => {
    const status = String(complaint.status || "open").toLowerCase();
    return status === "open" || status === "in_review";
  }).length;

  const denominator = Math.max(orders.length + complaints.length, 1);
  const errorRate = Number((((unresolvedDisputes + unresolvedComplaints) / denominator) * 100).toFixed(2));

  return {
    uptimeSeconds: Math.floor(process.uptime()),
    activeSessions,
    errorRate,
    activeUsers: users.filter((user) => (user.status || "active") === "active" && !user.suspended).length,
    unresolvedDisputes,
    unresolvedComplaints,
    checkedAt: new Date().toISOString(),
  };
};

const buildAnalyticsDashboard = async (range = "30d") => {
  const [users, products, orders, complaints] = await Promise.all([
    getAllUsers(),
    getAllProducts(),
    getAllOrders(),
    listComplaints(),
  ]);

  const rangeConfig = getRangeConfig(range, orders);

  const productsById = new Map(
    products
      .filter((product) => product?.id !== undefined && product?.id !== null)
      .map((product) => [String(product.id), product])
  );

  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + toNumber(order.total_price), 0);
  const activeListings = products.filter((product) => (product.approval_status || "approved") !== "rejected").length;

  const userWindow = getWindowStats(users, "created_at", rangeConfig.currentStart, rangeConfig.currentEnd, rangeConfig.previousStart, rangeConfig.previousEnd);
  const orderWindow = getWindowStats(orders, "created_at", rangeConfig.currentStart, rangeConfig.currentEnd, rangeConfig.previousStart, rangeConfig.previousEnd);
  const productActivity = getProductActivityCounts(products, rangeConfig.currentStart, rangeConfig.currentEnd, rangeConfig.previousStart, rangeConfig.previousEnd);

  const currentPeriodRevenue = orders
    .filter((order) => isWithinRange(order.created_at, rangeConfig.currentStart, rangeConfig.currentEnd))
    .reduce((sum, order) => sum + toNumber(order.total_price), 0);

  const previousPeriodRevenue = orders
    .filter((order) => isWithinRange(order.created_at, rangeConfig.previousStart, rangeConfig.previousEnd))
    .reduce((sum, order) => sum + toNumber(order.total_price), 0);

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      delta: calculatePercentChange(userWindow.currentCount, userWindow.previousCount),
      tone: "info",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      delta: calculatePercentChange(orderWindow.currentCount, orderWindow.previousCount),
      tone: "neutral",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      delta: calculatePercentChange(currentPeriodRevenue, previousPeriodRevenue),
      tone: "neutral",
    },
    {
      label: "Active Listings",
      value: activeListings,
      delta: calculatePercentChange(productActivity.currentActive, productActivity.previousActive),
      tone: "warning",
    },
  ];

  return {
    range: rangeConfig.range,
    rangeDays: rangeConfig.dayCount,
    statCards,
    revenueSeries: buildDailyRevenueSeries(orders, rangeConfig.currentStart, rangeConfig.currentEnd),
    salesBreakdown: buildSalesBreakdown(orders, productsById),
    revenueComparison: buildRevenueComparison(orders, rangeConfig.currentStart, rangeConfig.currentEnd, rangeConfig.previousStart, rangeConfig.previousEnd),
    topProducts: buildTopProducts(orders, productsById),
    topSellers: buildTopSellers(orders, productsById),
    activityFeed: buildActivityFeed(orders, users, complaints),
    platformHealth: buildPlatformHealth(users, orders, complaints),
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  buildAnalyticsDashboard,
};
