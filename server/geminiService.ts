import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyAhyQx7oPQ9ffTeyT91IlUbut0psAxrcMQ";
const genAI = new GoogleGenerativeAI(geminiApiKey);

export interface AnalyzeImageOptions {
  imageBuffer: Buffer;
  mimeType: string;
  prompt?: string;
}

export interface AnalyzeImageResult {
  text?: string;
  extractedData?: any;
  ocrText?: string; // Raw OCR text extracted
  confidence?: number; // OCR confidence score
  error?: string;
}

/**
 * Analyze a PDF or image using Gemini Vision API
 */
export async function analyzeImageWithGemini(
  options: AnalyzeImageOptions
): Promise<AnalyzeImageResult> {
  try {
    console.log("🔮 Gemini: Starting document analysis (image/PDF)");
    console.log("🔮 Gemini: MIME type:", options.mimeType);
    
    // Use gemini-1.5-pro for vision tasks (supports images and PDFs)
    // If this fails, the error will be caught and handled by the caller
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Convert buffer to base64
    const base64Data = options.imageBuffer.toString("base64");
    
    // Default prompt for document extraction - handles multiple document types
    const prompt = options.prompt || `You are a precise document extractor. Analyze this document (image or PDF) and extract all structured data. The document could be an invoice, bill, resume/CV, form, letter, or other document type.

Return ONLY valid JSON with the following structure (use null for fields that don't apply):

{
  "doc_type": "invoice|bill|resume|cv|form|letter|other",
  "issuer": "<company or issuer name or null>",
  "account_number": "<if present or null>",
  "invoice_date": "<YYYY-MM-DD or null>",
  "due_date": "<YYYY-MM-DD or null>",
  "amount_due": {"value": 1234.56, "currency": "INR|USD|..."} or null,
  "line_items": [{"description": "", "qty": 1, "unit_price": 0.0, "total": 0.0}],
  "recipient_name": "<if present - could be applicant name for resumes>",
  "recipient_email": "<if present>",
  "raw_text_snippet": "<extract all readable text content from the document, preserving structure>"
}

For resumes/CVs, focus on extracting: name, email, phone, skills, experience, education.
For invoices/bills, extract: issuer, dates, amounts, line items.
For other documents, extract all relevant structured information.

Extract all structured data from this document. Return ONLY valid JSON with the exact structure specified.`;

    // Gemini supports PDFs directly - use application/pdf mimeType for PDFs
    const mimeType = options.mimeType === "application/pdf" ? "application/pdf" : options.mimeType;
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log("🔮 Gemini: Raw response:", text.substring(0, 500));

    // Try to parse JSON from response
    let extractedData: any = null;
    let ocrText = text; // Store raw text as OCR text
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      extractedData = JSON.parse(jsonString);
      console.log("✅ Gemini: Successfully parsed JSON response");
      
      // If we have raw_text_snippet in extracted data, use that as OCR text
      if (extractedData.raw_text_snippet) {
        ocrText = extractedData.raw_text_snippet;
      }
    } catch (parseError) {
      console.warn("⚠️ Gemini: Failed to parse JSON, using raw text");
      // If JSON parsing fails, return the raw text
      return {
        text,
        ocrText: text,
        extractedData: {
          doc_type: "other",
          raw_text_snippet: text.substring(0, 1000),
        },
        confidence: 0.7, // Default confidence when JSON parsing fails
      };
    }

    return {
      text,
      ocrText,
      extractedData,
      confidence: 0.95, // High confidence for successful extraction
    };
  } catch (err: any) {
    console.error("❌ Gemini Service Error:", err);
    return {
      error: err.message || "Gemini service encountered an unexpected error",
    };
  }
}

/**
 * Generate text content using Gemini
 */
export async function generateTextWithGemini(
  prompt: string,
  modelName: string = "gemini-1.5-flash"
): Promise<{ text?: string; error?: string }> {
  try {
    console.log("🔮 Gemini: Generating text with model:", modelName);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini: Text generated successfully");
    return { text };
  } catch (err: any) {
    console.error("❌ Gemini Text Generation Error:", err);
    return {
      error: err.message || "Failed to generate text with Gemini",
    };
  }
}

/**
 * Check if Gemini service is available
 */
export function isGeminiAvailable(): boolean {
  return !!geminiApiKey && geminiApiKey !== "";
}

