const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  rfp: { type: mongoose.Schema.Types.ObjectId, ref: "RFP", required: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  rawContent: { type: String },
  parsedData: { type: Object },
  score: { type: Number },
  analysis: { type: String },
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Proposal", proposalSchema);
