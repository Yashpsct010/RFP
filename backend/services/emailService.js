const nodemailer = require("nodemailer");
const imap = require("imap-simple");
const simpleParser = require("mailparser").simpleParser;
const _ = require("lodash");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendRFP = async (vendorEmail, rfpTitle, rfpContent) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: vendorEmail,
    subject: `RFP Invitation: ${rfpTitle}`,
    text: `
      Dear Vendor,

      You are invited to submit a proposal for the following RFP:

      ${rfpTitle}
      
      --------------------------------------------------
      Requirements:
      
      Items:
      ${rfpContent.items
        .map(
          (item) =>
            `- ${item.name} (Qty: ${item.quantity})${
              item.specs ? `\n        Specs: ${item.specs}` : ""
            }`
        )
        .join("\n\n      ")}

      Additional Details:
      - Budget: ${rfpContent.budget ? rfpContent.budget : "Not specified"}
      - Deadline: ${
        rfpContent.deadline
          ? new Date(rfpContent.deadline).toDateString()
          : "Not specified"
      }
      - Payment Terms: ${rfpContent.paymentTerms || "Not specified"}
      - Warranty: ${rfpContent.warranty || "Not specified"}
      --------------------------------------------------

      Please reply to this email with your proposal attached or in the body.
      
      Best regards,
      Procurement Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send email");
  }
};

exports.fetchResponses = async (since = new Date(0), allowedSenders = []) => {
  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  try {
    const connection = await imap.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = [["SINCE", since]];
    const fetchOptions = {
      bodies: [""],
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`IMAP Search found ${messages.length} messages since ${since}`);
    const emails = [];

    // Normalize allowed senders
    const allowedSet =
      allowedSenders.length > 0
        ? new Set(allowedSenders.map((s) => s.toLowerCase()))
        : null;

    for (const message of messages) {
      const allParts = _.find(message.parts, { which: "" });
      if (!allParts) {
        console.warn(
          `Skipping message UID ${message.attributes.uid}: No body part found.`
        );
        continue;
      }
      const id = message.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";
      const simpleParser = require("mailparser").simpleParser;
      const parsed = await simpleParser(idHeader + allParts.body);

      const senderEmail = parsed.from.value[0].address.toLowerCase();

      // Filter: Only include if sender is in the allowed list (if list is provided)
      if (!allowedSet || allowedSet.has(senderEmail)) {
        emails.push({
          subject: parsed.subject,
          from: parsed.from.value[0].address,
          text: parsed.text,
          date: parsed.date,
        });
      }
    }

    connection.end();
    return emails;
  } catch (error) {
    console.error("IMAP Fetch Error:", error);
    return [];
  }
};
