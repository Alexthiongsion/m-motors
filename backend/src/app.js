const express = require("express");
const cors = require("cors");
const pool = require("./db");
const vehicleRoutes = require("./routes/vehicleRoutes");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

const localFrontendUrl = "http://localhost:5173";
const frontendUrl = normalizeOrigin(process.env.FRONTEND_URL);

if (process.env.NODE_ENV === "production" && !frontendUrl) {
  throw new Error("FRONTEND_URL must be defined in production");
}

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [frontendUrl]
    : [frontendUrl, localFrontendUrl].filter(Boolean);

app.use((req, res, next) => {
  const origin = normalizeOrigin(req.headers.origin);

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      message: "Origin not allowed by CORS.",
    });
  }

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    if (process.env.NODE_ENV !== "test") {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });

  next();
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      service: "m-motors-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "error",
      service: "m-motors-api",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable.",
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "Erreur interne du serveur.",
  });
});

module.exports = app;
