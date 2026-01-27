require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const bodyParser = require("body-parser");

const sequelize = require("./db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userKycRoutes = require("./routes/userKycRoutes");

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sequelize MySQL API",
      version: "1.0.0",
      description: "API for managing users with Sequelize and MySQL",
    },
    servers: [

      {
        url: "http://api.pprince.io",
      },
      {
        url: "http://localhost:3000",
      },
      {
        url: "http://user.pprince.io",
      },
      {
        url: "http://api.pprince.io",
      }, {
        url: "http://api.pprince.io/",
      },
      {
        url: "https://api.pprince.io/",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // files containing annotations
};

const app = express();
const PORT = process.env.PORT || 3000;

// Update Swagger server URL to match the actual port
swaggerOptions.definition.servers[0].url = `http://localhost:${PORT}`;
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// // CORS Configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);

//     // In production, you should specify allowed origins
//     // For now, allow all origins for development
//     callback(null, true);

//     // Example for production:
//     const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com', "https://www.pprince.io", "http://admin.pprince.io"];
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//     "Origin",
//     "Access-Control-Request-Method",
//     "Access-Control-Request-Headers"
//   ],
//   exposedHeaders: ["Authorization"],
//   credentials: true, // Allow cookies/auth headers
//   preflightContinue: false,
//   optionsSuccessStatus: 204
// };

const allowedOrigins = [
  "https://www.pprince.io",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://admin.pprince.io",
  "https://user.pprince.io"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};


// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

app.use(
  "/api/kyc/webhookSumsub",
  bodyParser.raw({ type: "application/json" }),
  require("./controllers/userKycController").sumsubWebhook
);


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/payments", paymentRoutes);
app.use("/api/kyc", userKycRoutes);

// Sync database and start server
sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `Swagger docs available at http://localhost:${PORT}/api-docs`
      );
    });
  })
  .catch((error) => {
    console.error("Unable to sync database:", error);
  });

module.exports = app;
