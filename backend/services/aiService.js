const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.parseRFPRequirement = async (text) => {
  const prompt = `
    You are an AI assistant for a procurement system. 
    Extract structured data from the following natural language procurement request.
    Return ONLY a valid JSON object with the following fields:
    - title: A short summary title
    - items: Array of objects { name, quantity, specs }
    - budget: Number (if mentioned)
    - deadline: Date string (ISO 8601 format YYYY-MM-DD, calculate based on relative time like "in 30 days" from today. If specific date not mentioned, return null)
    - paymentTerms: String
    - warranty: String
    
    Request: "${text}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonString = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error("Failed to parse requirements with AI");
  }
};

exports.parseVendorResponse = async (emailText) => {
  const prompt = `
    You are an AI assistant for a procurement system.
    Extract structured data from the following vendor email response to an RFP.
    Return ONLY a valid JSON object with the following fields:
    - vendorName: String (inferred from text if possible)
    - totalCost: Number
    - deliveryTime: String
    - warranty: String
    - paymentTerms: String
    - items: Array of objects { name, price, quantity, notes }
    - summary: Short summary of the proposal
    
    Email Content: "${emailText}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonString = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonString);
  } catch (error) {
    return { summary: "Failed to parse proposal automatically." };
  }
};

exports.compareProposals = async (rfpRequirements, proposals) => {
  const prompt = `
    You are an expert procurement analyst.
    Compare the following vendor proposals against the RFP requirements.
    
    RFP Requirements:
    ${JSON.stringify(rfpRequirements, null, 2)}
    
    Vendor Proposals:
    ${JSON.stringify(
      proposals.map((p) => ({
        vendor: p.vendor.name,
        data: p.parsedData,
      })),
      null,
      2
    )}
    
    Return ONLY a valid JSON object with the following structure:
    {
      "matrix": [
        { "vendor": "Vendor A", "totalCost": 1000, "delivery": "30 days", "warranty": "1 year", "score": 85, "pros": ["Cheap"], "cons": ["Slow delivery"] }
      ],
      "recommendation": "I recommend Vendor A because...",
      "summary": "Vendor A offers the best price while Vendor B has better terms..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonString = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error("Failed to generate comparison");
  }
};
