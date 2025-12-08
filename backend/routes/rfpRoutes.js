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
const Proposal = require("../models/Proposal");

// Helper to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

router.post("/check-responses", async (req, res) => {
  try {
    // 1. Fetch Active "Sent" RFPs
    const sentRFPs = await RFP.find({ status: "Sent" }).populate("vendors");

    if (sentRFPs.length === 0) {
      return res.json({
        message: "No active 'Sent' RFPs found. No emails checked.",
        newProposals: [],
        skipped: [],
      });
    }

    // 2. Strict Filtering Setup
    // Earliest Date: Min(rfp.lastSentAt || rfp.createdAt)
    let earliestDate = new Date();
    const vendorMap = new Map(); // Email -> Vendor Object
    const allowedVendorEmails = new Set();
    const vendorRfpMap = new Map(); // Email -> [RFP Objects]

    sentRFPs.forEach((rfp) => {
      // Determine effective start time for this RFP
      const startTime = rfp.lastSentAt || rfp.createdAt;
      if (startTime < earliestDate) earliestDate = startTime;

      rfp.vendors.forEach((v) => {
        const email = v.email.toLowerCase();
        allowedVendorEmails.add(email);
        vendorMap.set(email, v);

        if (!vendorRfpMap.has(email)) vendorRfpMap.set(email, []);
        vendorRfpMap.get(email).push(rfp);
      });
    });

    // 3. Strict Fetch
    console.log(
      `Fetching emails since ${earliestDate.toISOString()} from ${
        allowedVendorEmails.size
      } vendors.`
    );
    const emails = await emailService.fetchResponses(
      earliestDate,
      Array.from(allowedVendorEmails)
    );

    const newProposals = [];
    const skippedEmails = [];

    // 4. Process Filtered Emails
    for (const email of emails) {
      const emailSender = email.from.toLowerCase();
      const vendor = vendorMap.get(emailSender);

      // Should technically exist due to fetch scope, but safe check
      if (!vendor) {
        skippedEmails.push({
          subject: email.subject,
          from: email.from,
          reason: "Vendor not in whitelist (Validation)",
        });
        continue;
      }

      // Find Candidate RFPs for this specific vendor
      const candidateRFPs = vendorRfpMap.get(emailSender) || [];
      let matchedRFP = null;

      // Match Strategy 1: Subject Match (Priority)
      for (const rfp of candidateRFPs) {
        const escapedTitle = escapeRegExp(rfp.title);
        const regex = new RegExp(escapedTitle, "i");
        if (regex.test(email.subject)) {
          matchedRFP = rfp;
          console.log(`Matched via Subject: ${email.subject} -> ${rfp.title}`);
          break;
        }
      }

      // Match Strategy 2: AI Classification (Fallback)
      if (!matchedRFP && candidateRFPs.length > 0) {
        console.log(
          `Checking AI matching for ${emailSender} against ${candidateRFPs.length} RFPs`
        );
        const rfpTitles = candidateRFPs.map((r) => r.title);
        // AI Service expects text + subject and array of titles
        const index = await aiService.classifyEmailToRFP(
          email.text + "\nSubject: " + email.subject,
          rfpTitles
        );
        console.log(`AI Result Index: ${index}`);

        if (index !== -1 && candidateRFPs[index]) {
          matchedRFP = candidateRFPs[index];
          console.log(
            `Matched via AI: ${email.subject} -> ${matchedRFP.title}`
          );
        }
      }

      if (!matchedRFP) {
        const candidateTitles = candidateRFPs.map((r) => r.title).join(", ");
        skippedEmails.push({
          subject: email.subject,
          from: email.from,
          reason: `Could not match email to any invited RFP. Candidates were: [${candidateTitles}]`,
        });
        continue;
      }

      // Check Duplicates
      const existing = await Proposal.findOne({
        rfp: matchedRFP._id,
        vendor: vendor._id,
      });
      if (existing) {
        skippedEmails.push({
          subject: email.subject,
          from: email.from,
          reason: "Proposal already exists",
        });
        continue;
      }

      // Parse & Save
      const parsedData = await aiService.parseVendorResponse(email.text);
      const proposal = new Proposal({
        rfp: matchedRFP._id,
        vendor: vendor._id,
        rawContent: email.text,
        parsedData,
        analysis: parsedData.summary,
        receivedAt: email.date,
      });
      await proposal.save();
      newProposals.push(proposal);
    }

    res.json({
      message: `Processed ${emails.length} valid emails. Created ${newProposals.length} proposals.`,
      newProposals,
      skipped: skippedEmails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

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
    rfp.lastSentAt = new Date(); // Track when invites were sent
    rfp.vendors = [...new Set([...rfp.vendors, ...vendorIds])];
    await rfp.save();

    res.json({ message: "RFP sent to vendors" });
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

module.exports = router;
