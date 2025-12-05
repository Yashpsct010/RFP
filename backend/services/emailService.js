const nodemailer = require("nodemailer");
const imap = require("imap-simple");
const simpleParser = require("mailparser").simpleParser;

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

exports.fetchResponses = async () => {
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

    const searchCriteria = [["HEADER", "SUBJECT", "RFP Invitation"]];
    const fetchOptions = {
      bodies: [""],
      markSeen: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const emails = [];

    for (const item of messages) {
      const all = item.parts.find((part) => part.which === "");
      const id = item.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";
      const mail = await simpleParser(idHeader + all.body);

      emails.push({
        from: mail.from ? mail.from.text : "Unknown Sender",
        subject: mail.subject || "No Subject",
        text: mail.text || mail.html || "",
        date: mail.date || new Date(),
      });
    }

    connection.end();
    return emails;
  } catch (error) {
    return [];
  }
};
