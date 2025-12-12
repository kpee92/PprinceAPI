require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const sequelize = require("./db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

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
        url: "http://localhost:3000",
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
const PORT = process.env.PORT || 3002;

// Update Swagger server URL to match the actual port
swaggerOptions.definition.servers[0].url = `http://localhost:${PORT}`;
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/payments", paymentRoutes);

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
