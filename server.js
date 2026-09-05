require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/userRoutes/authRoute.js");
const adminRoutes = require("./routes/adminRoutes/adminRoutes.js");
const permissionRoutes = require("./routes/permissionRoutes/permissionRoutes.js");
const corporateRoutes = require("./routes/corporateRoutes/corporateRoutes.js");
const roleRoutes = require("./routes/roleRoutes/roleRoutes.js");
const licenseTypeRoutes = require("./routes/licenseTypeRoutes/licenseTypeRoutes.js");
const featureTypeRoutes = require("./routes/featureTypeRoutes/featureTypeRoutes.js");
const licenseRoutes = require("./routes/licenseRoutes/licenseRoutes.js");
const userLicenseRoutes = require("./routes/userLicenseRoutes/userLicenseRoutes.js");
const licenseManagerRoutes = require("./routes/licenseManagerRoutes/licenseManagerRoutes.js");
const featureRoutes = require("./routes/featureRoutes/featureRoutes.js");
const speechRoutes = require("./routes/speechRoutes/speechRoute.js");
const practiceRoutes = require("./routes/practiceRoutes/practiceRoutes.js");
const errorRoute = require("./routes/errorRoutes/errorRoutes.js");
const satisticsRoute = require("./routes/satisticsRoute/satisticsRoute.js");

const app = express();
const cors = require("cors");
const connection = require("./database");
const cookieParser = require("cookie-parser");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "XGOL APIS",
      version: "1.0.0",
      description: "API description",
      servers: [
        { url: "http://localhost:8080" },
        { url: "https://api.xgol.pro" },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/**/*.js"],
};

const allowedOrigins = [
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  process.env.FRONT_URL,
  process.env.FRONT_URL_DEP,
  "https://xgol.pro",
  "https://www.xgol.pro",
  "http://localhost:3000",
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

let databasePromise;
const ensureDatabaseConnection = () => {
  if (!databasePromise) {
    databasePromise = connection().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// middlewares
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
morgan.token("user", (req, res) => {
  return req.user ? req.user.username : "guest";
});
app.use(
  morgan(
    ":remote-addr - :user - :method :url :status - :response-time ms - :res[content-length]"
  )
);

app.get("/health", async (_req, res) => {
  try {
    await ensureDatabaseConnection();
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check database connection failed:", error);
    res.status(503).json({ status: "error", message: "Database unavailable" });
  }
});

app.use(async (_req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(503).json({ message: "Database unavailable" });
  }
});

app.use("/api", authRoutes);
app.use("/api", permissionRoutes);
app.use("/api", roleRoutes);
app.use("/api", corporateRoutes);
app.use("/api", licenseTypeRoutes);
app.use("/api", featureTypeRoutes);
app.use("/api", licenseRoutes);
app.use("/api", licenseManagerRoutes);
app.use("/api", featureRoutes);
app.use("/api", userLicenseRoutes);
app.use("/api", speechRoutes);
app.use("/api", practiceRoutes);
app.use("/api", require("./routes/coachingRoutes"));
app.use("/api", satisticsRoute);
app.use("/api", adminRoutes);
app.use("/api", errorRoute);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;

if (require.main === module) {
  ensureDatabaseConnection()
    .then(() => {
      const port = process.env.PORT || 8080;

      app.listen(port, () => {
        console.log(`Server is running on ${port}...`);
      });
    })
    .catch((error) => {
      console.log("Could not connect to database!");
      console.error(error);
    });
}
