const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rfp-system")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

app.use("/api/rfps", require("./routes/rfpRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));

app.get("/", (req, res) => {
  res.send("RFP System API Running");
});

app.listen(PORT, () => {});
