const express = require("express");
const cors = require("cors");
const vehicleRoutes = require("./routes/vehicleRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "M-Motors API is running" });
});

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
