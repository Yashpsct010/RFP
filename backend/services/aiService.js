const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-tts",
];

// Helper to extract JSON from text (handles Markdown codes and conversational fluff)
function extractJSON(text) {
  try {
    // 1. Try standard cleaning of code blocks
    const cleanStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanStr);
  } catch (e) {
    // 2. Fallback: Regex to find the first JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("No JSON found in response: " + text.substring(0, 100));
  }
}

// Helper to get model instance
const getModel = (modelName) => genAI.getGenerativeModel({ model: modelName });

// Retry Helper with Model Fallback & Exponential Backoff
async function generateContentWithRetry(prompt, retriesPerModel = 1) {
  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    console.log(`Trying AI Model: ${modelName}`);
    const currentModel = getModel(modelName);

    for (let i = 0; i < retriesPerModel; i++) {
      try {
        return await currentModel.generateContent(prompt);
      } catch (error) {
        lastError = error;
        const isQuotaError =
          error.message?.includes("429") ||
          error.status === 429 ||
          error.message?.includes("quota") ||
          error.message?.includes("Too Many Requests");

        if (isQuotaError) {
          console.warn(
            `Quota exceeded for ${modelName}. Switching to next model...`
          );
          break; // Break inner loop to switch to next model immediately
        }

        // If it's NOT a quota error (e.g. server error), maybe we retry same model?
        // For now, let's treat any error as a signal to try next model for robustness.
        console.warn(`Error with ${modelName}: ${error.message}. Switching...`);
        break;
      }
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
}

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
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    const textResponse = response.text();
    console.log(textResponse);
    return extractJSON(textResponse);
  } catch (error) {
    console.log("Parsing Error:", error.message);
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
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    const textResponse = response.text();

    return extractJSON(textResponse);
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
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    const textResponse = response.text();
    console.log("AI Comparison Raw Response:", textResponse);

    return extractJSON(textResponse);
  } catch (error) {
    console.error("Comparison Error:", error);
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON. Raw response was logged above.");
    }
    throw new Error("Failed to generate comparison: " + error.message);
  }
};

exports.classifyEmailToRFP = async (emailText, rfpTitles) => {
  const prompt = `
    You are an intelligent email classifier for a procurement system.
    
    Task: Identify which Request for Proposal (RFP) the following email is related to.
    
    Available RFPs (indexed):
    ${JSON.stringify(rfpTitles, null, 2)}
    
    Email Content: 
    """
    ${emailText.substring(0, 5000)}
    """
    
    Instructions:
    1. Analyze the email details (subject, body, items mentioned).
    2. Match it to one of the provided RFPs.
    3. If it matches, return the index (0, 1, 2...).
    4. If it is ambiguous, unrelated, or spam, return -1.
    5. Return ONLY a JSON object: { "rfpIndex": number }
  `;

  try {
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean code blocks if present
    const data = extractJSON(text);
    return typeof data.rfpIndex === "number" ? data.rfpIndex : -1;
  } catch (error) {
    console.error("AI Classification Error:", error);
    return -1;
  }
};
