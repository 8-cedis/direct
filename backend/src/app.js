const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const crmRoutes = require("./routes/crmRoutes");
const path = require("path");
const uploadRoutes = require("./routes/uploadRoutes");
const { seedLocalData } = require("./database/seedLocalData");

const app = express();

seedLocalData();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Serve uploaded images from the /uploads URL
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ message: "Farm store backend is running" });
});

app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentRoutes);
app.use("/api", cartRoutes);
app.use("/api", sellerRoutes);
app.use("/api", adminRoutes);
app.use("/api", crmRoutes);
app.use("/api", uploadRoutes);

module.exports = app;
