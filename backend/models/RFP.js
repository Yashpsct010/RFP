const mongoose = require("mongoose");

const rfpSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: Object, required: true },
  budget: { type: Number },
  deadline: { type: Date },
  status: { type: String, enum: ["Draft", "Sent", "Closed"], default: "Draft" },
  vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RFP", rfpSchema);
