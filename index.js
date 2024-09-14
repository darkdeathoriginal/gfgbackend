const express = require("express");
const { PORT, MONGODB_URI,SITE_URL } = require("./config");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const authRoutes = require("./routes/auth");
const libraryRoutes = require("./routes/library");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/library", libraryRoutes);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "library API",
      version: "0.1.0",
      description: "A simple library Manager API",
    },
    servers: [
      {
        url: SITE_URL,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs,{
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ]
}));
app.get("/", (req, res) => {
  res.redirect("/docs");
});
if(!MONGODB_URI){
  console.error("MONGODB_URI is required");
  process.exit(1);
}
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB....");
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}....`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB....", err);
  });
