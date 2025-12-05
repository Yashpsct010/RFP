const express = require("express");
const router = express.Router();
const RFP = require("../models/RFP");
const aiService = require("../services/aiService");


router.post("/generate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const structuredData = await aiService.parseRFPRequirement(text);

    res.json(structuredData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/", async (req, res) => {
  try {
    const rfp = new RFP(req.body);
    await rfp.save();
    res.status(201).json(rfp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const rfps = await RFP.find().sort({ createdAt: -1 });
    res.json(rfps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id).populate("vendors");
    if (!rfp) return res.status(404).json({ error: "RFP not found" });
    res.json(rfp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const emailService = require("../services/emailService");
const Vendor = require("../models/Vendor");


router.post("/:id/send", async (req, res) => {
  try {
    const { vendorIds } = req.body;
    const rfp = await RFP.findById(req.params.id);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    for (const vendor of vendors) {
      await emailService.sendRFP(vendor.email, rfp.title, rfp.requirements);
    }

    rfp.status = "Sent";
    rfp.vendors = [...new Set([...rfp.vendors, ...vendorIds])];
    await rfp.save();

    res.json({ message: "RFP sent to vendors" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const Proposal = require("../models/Proposal");


router.post("/check-responses", async (req, res) => {
  try {
    const emails = await emailService.fetchResponses();
    const newProposals = [];

    for (const email of emails) {
      console.log(
        `Processing email from: ${email.from}, Subject: ${email.subject}`
      );
      const parsedData = await aiService.parseVendorResponse(email.text);
      const emailMatch = email.from.match(/<(.+)>/) || [null, email.from];
      const senderEmail = emailMatch[1] || emailMatch[0];


      let vendor = await Vendor.findOne({ email: senderEmail });

      // If vendor not found, maybe try to find by name from AI or create new?
      // For this assignment, let's skip if vendor unknown or create a "Unknown Vendor"
      if (!vendor) {
        // Optional: Create vendor on the fly?
        // vendor = new Vendor({ name: parsedData.vendorName || 'Unknown', email: senderEmail });
        // await vendor.save();
        console.log(`Unknown vendor: ${senderEmail} - Skipping`);
        continue;
      }



      const rfpTitleMatch = email.subject
        .replace("Re: RFP Invitation: ", "")
        .trim();


      const rfp = await RFP.findOne({ title: rfpTitleMatch });

      if (rfp) {
        const proposal = new Proposal({
          rfp: rfp._id,
          vendor: vendor._id,
          rawContent: email.text,
          parsedData: parsedData,
          analysis: parsedData.summary,
          receivedAt: email.date,
        });
        await proposal.save();
        newProposals.push(proposal);
      } else {
        console.log("RFP not found for title:", rfpTitleMatch);
      }
    }

    res.json({ message: `Processed ${emails.length} emails`, newProposals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/:id/proposals", async (req, res) => {
  try {
    const proposals = await Proposal.find({ rfp: req.params.id }).populate(
      "vendor"
    );
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/:id/compare", async (req, res) => {
  try {
    const rfp = await RFP.findById(req.params.id);
    const proposals = await Proposal.find({ rfp: req.params.id }).populate(
      "vendor"
    );

    if (proposals.length === 0) {
      return res.status(400).json({ error: "No proposals to compare" });
    }

    const comparison = await aiService.compareProposals(
      rfp.requirements,
      proposals
    );
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
