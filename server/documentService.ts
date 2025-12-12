import OpenAI from "openai";
import { analyzeDocumentWithBytez, generateDialogueSummary } from "./bytezService";
import { analyzeImageWithGemini, isGeminiAvailable } from "./geminiService";
import { sanitizeText, sanitizeExtractedData, limitTextLength } from "./utils/sanitize";
import mammoth from "mammoth";

// Initialize OpenAI client (optional - fallback for advanced field extraction)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  isRedacted?: boolean;
}

export interface DocumentAnalysisResult {
  fields: ExtractedField[];
  extractedData?: any; // Full extracted JSON for reasoner
  summary?: string;
  ocrText?: string; // Raw OCR/extracted text for preview
  ocrConfidence?: number; // Overall OCR confidence score
  error?: string;
}

export async function analyzeDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DocumentAnalysisResult> {
  try {
    console.log("📄 Document Analysis: Starting analysis for file:", fileName, "Type:", mimeType);

    // Handle text-based documents (works without OpenAI, uses Bytez for summarization)
    if (mimeType === "text/plain" || mimeType === "text/markdown" || mimeType.startsWith("text/")) {
      const text = fileBuffer.toString("utf-8");
      console.log("📄 Processing text document, length:", text.length);

      // Use ApyHub for summarization
      let summary = text.substring(0, 500);
      try {
        const { isApyHubAvailable, summarizeLargeText } = await import("./apyhubService");
        const { uploadTextForApyHub } = await import("./storageHelper");
        
        if (isApyHubAvailable() && text.length > 100) {
          const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
          const apyhubResult = await summarizeLargeText(
            text,
            (buffer, filename) => uploadTextForApyHub(buffer, filename, serverUrl),
            { summary_length: "medium", output_language: "en" }
          );
          
          if (!apyhubResult.error && apyhubResult.summary) {
            summary = apyhubResult.summary;
            console.log("✅ ApyHub summary generated for document");
          } else {
            console.warn("⚠️ ApyHub summary failed:", apyhubResult.error);
          }
        }
      } catch (summaryError: any) {
        console.warn("⚠️ ApyHub summary failed, using text snippet:", summaryError.message);
      }

      // Basic field extraction from text (simple pattern matching)
      const fields: ExtractedField[] = [];
      const extractedData: any = {
        doc_type: "text",
        raw_text_snippet: text.substring(0, 1000),
      };

      // Try to extract basic patterns
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.7 });
        extractedData.recipient_email = emailMatch[0];
      }

      const dateMatch = text.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);
      if (dateMatch) {
        fields.push({ key: "date", value: dateMatch[0], confidence: 0.6 });
        extractedData.invoice_date = dateMatch[0];
      }

      const amountMatch = text.match(/(?:USD|INR|EUR|GBP|₹|\$|€|£)\s*[\d,]+\.?\d*/i);
      if (amountMatch) {
        fields.push({ key: "amount_due", value: amountMatch[0], confidence: 0.6 });
        extractedData.amount_due = { value: parseFloat(amountMatch[0].replace(/[^\d.]/g, "")), currency: "USD" };
      }

      return {
        fields,
        extractedData: sanitizeExtractedData(extractedData),
        summary: sanitizeText(summary),
      };
    }

    // For images, use Bytez (primary), then Gemini AI, then OpenAI (fallback)
    if (mimeType.startsWith("image/")) {
      let parsed: any = null;
      let ocrTextFromAnalysis: string | undefined = undefined;
      
      // Try Bytez first (preferred for document analysis)
      try {
        console.log("📄 Using Bytez for image document analysis");
        const bytezResult = await analyzeDocumentWithBytez({
          fileBuffer: fileBuffer,
          fileName: fileName,
          mimeType: mimeType,
        });

        if (bytezResult.error) {
          console.warn("⚠️ Bytez analysis failed:", bytezResult.error);
        } else if (bytezResult.extractedData) {
          parsed = bytezResult.extractedData;
          ocrTextFromAnalysis = bytezResult.ocrText;
          console.log("✅ Bytez successfully extracted document data");
        }
      } catch (bytezError: any) {
        console.warn("⚠️ Bytez failed, trying Gemini:", bytezError.message);
      }
      
      // Try Gemini if Bytez failed or not available
      if (!parsed && isGeminiAvailable()) {
        try {
          console.log("🔮 Using Gemini AI for image analysis");
          const geminiResult = await analyzeImageWithGemini({
            imageBuffer: fileBuffer,
            mimeType: mimeType,
          });

          if (geminiResult.error) {
            console.warn("⚠️ Gemini analysis failed:", geminiResult.error);
            throw new Error(geminiResult.error);
          }

          if (geminiResult.extractedData) {
            parsed = geminiResult.extractedData;
            console.log("✅ Gemini successfully extracted document data");
            // Store OCR text for preview
            if (geminiResult.ocrText) {
              parsed.ocrText = geminiResult.ocrText;
            }
          } else if (geminiResult.text) {
            // If we got text but no structured data, create basic structure
            parsed = {
              doc_type: "other",
              raw_text_snippet: geminiResult.text.substring(0, 1000),
              ocrText: geminiResult.text,
            };
          }
        } catch (geminiError: any) {
          console.warn("⚠️ Gemini failed, trying OpenAI fallback:", geminiError.message);
        }
      }

      // Fallback to OpenAI if Gemini failed or not available
      if (!parsed && openai) {
        try {
          console.log("🔄 Using OpenAI for image analysis (fallback)");
          const base64 = fileBuffer.toString("base64");
          const dataUrl = `data:${mimeType};base64,${base64}`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a precise extractor. Input: the full text of a document (invoice, bill, form, letter). Output: JSON only with keys:

{
  "doc_type": "invoice|bill|form|letter|other",
  "issuer": "<company or issuer name or null>",
  "account_number": "<if present or null>",
  "invoice_date": "<YYYY-MM-DD or null>",
  "due_date": "<YYYY-MM-DD or null>",
  "amount_due": {"value": 1234.56, "currency": "INR|USD|..."} or null,
  "line_items": [{"description": "", "qty": 1, "unit_price": 0.0, "total": 0.0}],
  "recipient_name": "<if present>",
  "recipient_email": "<if present>",
  "raw_text_snippet": "<short snippet for context>"
}

Return ONLY valid JSON.`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: dataUrl,
                    },
                  },
                  {
                    type: "text",
                    text: "Extract all structured data from this document. Return ONLY valid JSON with the exact structure specified.",
                  },
                ],
              },
            ],
            max_tokens: 2000,
          });

          const content = response.choices[0]?.message?.content || "{}";
          console.log("📄 Document Analysis: Raw OpenAI response:", content);

          // Parse the JSON response
          try {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            parsed = JSON.parse(jsonString);
            console.log("✅ OpenAI successfully extracted document data");
          } catch (parseError) {
            console.error("📄 Failed to parse OpenAI JSON response:", parseError);
            throw parseError;
          }
        } catch (openaiError: any) {
          console.error("❌ OpenAI fallback also failed:", openaiError.message);
        }
      }

      // If both failed, return error
      if (!parsed) {
        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "image",
            raw_text_snippet: `Image document: ${fileName}`,
          }),
          summary: sanitizeText(`This is an image document named ${fileName}. Unable to extract structured data. Please ensure GEMINI_API_KEY or OPENAI_API_KEY is configured.`),
        };
      }

      // Use ApyHub for summarization if we have text content
      let summary = parsed.raw_text_snippet || "";
      if (parsed.raw_text_snippet && parsed.raw_text_snippet.length > 100) {
        try {
          const { isApyHubAvailable, summarizeLargeText } = await import("./apyhubService");
          const { uploadTextForApyHub } = await import("./storageHelper");
          
          if (isApyHubAvailable()) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText(
              parsed.raw_text_snippet,
              (buffer, filename) => uploadTextForApyHub(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = apyhubResult.summary;
              console.log("✅ ApyHub summary generated for extracted document content");
            } else {
              console.warn("⚠️ ApyHub summary failed:", apyhubResult.error);
            }
          }
        } catch (summaryError: any) {
          console.warn("⚠️ ApyHub summary failed, using raw text snippet:", summaryError.message);
        }
      }

      // Convert to fields format for backward compatibility
      const fields: ExtractedField[] = [];
      if (parsed.issuer) fields.push({ key: "issuer", value: parsed.issuer, confidence: 0.95 });
      if (parsed.account_number) fields.push({ key: "account_number", value: parsed.account_number, confidence: 0.90, isRedacted: true });
      if (parsed.invoice_date) fields.push({ key: "date", value: parsed.invoice_date, confidence: 0.99 });
      if (parsed.due_date) fields.push({ key: "due_date", value: parsed.due_date, confidence: 0.96 });
      if (parsed.amount_due) {
        const amountStr = `${parsed.amount_due.currency || ""} ${parsed.amount_due.value}`.trim();
        fields.push({ key: "amount_due", value: amountStr, confidence: 0.97 });
      }
      if (parsed.line_items && parsed.line_items.length > 0) {
        fields.push({ key: "line_items", value: `${parsed.line_items.length} items`, confidence: 0.92 });
      }
      if (parsed.recipient_name) fields.push({ key: "recipient_name", value: parsed.recipient_name, confidence: 0.90 });
      if (parsed.recipient_email) fields.push({ key: "recipient_email", value: parsed.recipient_email, confidence: 0.88 });

      return {
        fields,
        extractedData: sanitizeExtractedData(parsed),
        summary: sanitizeText(summary),
        ocrText: sanitizeText(ocrTextFromAnalysis || parsed.ocrText || parsed.raw_text_snippet || ""),
        ocrConfidence: 0.95, // High confidence for extraction
      };
    }

    // Handle PDFs - use Bytez (primary), then Gemini (supports PDFs directly)
    if (mimeType === "application/pdf") {
      let parsed: any = null;
      let ocrTextFromAnalysis: string | undefined = undefined;
      
      // Try Bytez first (preferred for document analysis)
      try {
        console.log("📄 Using Bytez for PDF document analysis");
        const bytezResult = await analyzeDocumentWithBytez({
          fileBuffer: fileBuffer,
          fileName: fileName,
          mimeType: "application/pdf",
        });

        if (bytezResult.error) {
          console.warn("⚠️ Bytez PDF analysis failed:", bytezResult.error);
        } else if (bytezResult.extractedData) {
          parsed = bytezResult.extractedData;
          ocrTextFromAnalysis = bytezResult.ocrText;
          console.log("✅ Bytez successfully extracted PDF data");
        }
      } catch (bytezError: any) {
        console.warn("⚠️ Bytez PDF failed, trying Gemini:", bytezError.message);
      }
      
      // Try Gemini if Bytez failed (supports PDFs directly)
      if (!parsed && isGeminiAvailable()) {
        try {
          console.log("🔮 Using Gemini AI for PDF analysis");
          const geminiResult = await analyzeImageWithGemini({
            imageBuffer: fileBuffer,
            mimeType: "application/pdf",
          });

          if (geminiResult.error) {
            console.warn("⚠️ Gemini PDF analysis failed:", geminiResult.error);
            throw new Error(geminiResult.error);
          }

          if (geminiResult.extractedData) {
            parsed = geminiResult.extractedData;
            // Store OCR text for preview
            if (geminiResult.ocrText) {
              parsed.ocrText = geminiResult.ocrText;
            }
            console.log("✅ Gemini successfully extracted PDF data");
          } else if (geminiResult.text) {
            // If we got text but no structured data, create basic structure
            parsed = {
              doc_type: "pdf",
              raw_text_snippet: geminiResult.text.substring(0, 1000),
              ocrText: geminiResult.text,
            };
          }
        } catch (geminiError: any) {
          console.warn("⚠️ Gemini PDF analysis failed:", geminiError.message);
        }
      }

      // Fallback to OpenAI if Gemini failed or not available
      if (!parsed && openai) {
        return {
          fields: [],
          error: "PDF analysis requires conversion to images. Please upload the document as an image (PNG/JPG) or use a PDF-to-image converter first.",
        };
      }

      // If both failed, return basic info
      if (!parsed) {
        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "pdf",
            raw_text_snippet: `PDF document: ${fileName}`,
          }),
          summary: sanitizeText(`This is a PDF document named ${fileName}. Unable to extract structured data. Please ensure GEMINI_API_KEY is configured.`),
        };
      }

      // Use ApyHub for summarization if we have text content
      let summary = parsed.raw_text_snippet || "";
      if (parsed.raw_text_snippet && parsed.raw_text_snippet.length > 100) {
        try {
          const { isApyHubAvailable, summarizeLargeText } = await import("./apyhubService");
          const { uploadTextForApyHub } = await import("./storageHelper");
          
          if (isApyHubAvailable()) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText(
              parsed.raw_text_snippet,
              (buffer, filename) => uploadTextForApyHub(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = apyhubResult.summary;
              console.log("✅ ApyHub summary generated for PDF content");
            } else {
              console.warn("⚠️ ApyHub summary failed:", apyhubResult.error);
            }
          }
        } catch (summaryError: any) {
          console.warn("⚠️ ApyHub summary failed, using raw text snippet:", summaryError.message);
        }
      }

      // Convert to fields format for backward compatibility
      const fields: ExtractedField[] = [];
      if (parsed.issuer) fields.push({ key: "issuer", value: parsed.issuer, confidence: 0.95 });
      if (parsed.account_number) fields.push({ key: "account_number", value: parsed.account_number, confidence: 0.90, isRedacted: true });
      if (parsed.invoice_date) fields.push({ key: "date", value: parsed.invoice_date, confidence: 0.99 });
      if (parsed.due_date) fields.push({ key: "due_date", value: parsed.due_date, confidence: 0.96 });
      if (parsed.amount_due) {
        const amountStr = `${parsed.amount_due.currency || ""} ${parsed.amount_due.value}`.trim();
        fields.push({ key: "amount_due", value: amountStr, confidence: 0.97 });
      }
      if (parsed.line_items && parsed.line_items.length > 0) {
        fields.push({ key: "line_items", value: `${parsed.line_items.length} items`, confidence: 0.92 });
      }
      if (parsed.recipient_name) fields.push({ key: "recipient_name", value: parsed.recipient_name, confidence: 0.90 });
      if (parsed.recipient_email) fields.push({ key: "recipient_email", value: parsed.recipient_email, confidence: 0.88 });
      
      // For resumes/CVs, extract common fields
      if (parsed.doc_type === "resume" || parsed.doc_type === "cv" || fileName.toLowerCase().includes("resume") || fileName.toLowerCase().includes("cv")) {
        // Try to extract name, email, phone, skills from raw_text_snippet
        const text = parsed.raw_text_snippet || "";
        const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch && !fields.find(f => f.key === "recipient_email")) {
          fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.85 });
        }
        const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          fields.push({ key: "phone", value: phoneMatch[0], confidence: 0.75 });
        }
      }

      return {
        fields,
        extractedData: sanitizeExtractedData(parsed),
        summary: sanitizeText(summary),
        ocrText: sanitizeText(ocrTextFromAnalysis || parsed.ocrText || parsed.raw_text_snippet || ""),
        ocrConfidence: 0.95, // High confidence for extraction
      };
    }

    // Handle DOCX files
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        console.log("📄 Processing DOCX file:", fileName);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text = sanitizeText(result.value);
        
        if (!text || text.length === 0) {
          return {
            fields: [],
            error: "Could not extract text from DOCX file. The file may be corrupted or empty.",
          };
        }

        console.log("✅ Extracted text from DOCX, length:", text.length);

        // Use ApyHub for summarization
        let summary = text.substring(0, 500);
        try {
          const { isApyHubAvailable, summarizeLargeText } = await import("./apyhubService");
          const { uploadTextForApyHub } = await import("./storageHelper");
          
          if (isApyHubAvailable() && text.length > 100) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText(
              text,
              (buffer, filename) => uploadTextForApyHub(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = sanitizeText(apyhubResult.summary);
              console.log("✅ ApyHub summary generated for DOCX");
            } else {
              console.warn("⚠️ ApyHub summary failed:", apyhubResult.error);
              summary = sanitizeText(text.substring(0, 500));
            }
          }
        } catch (summaryError: any) {
          console.warn("⚠️ ApyHub summary failed, using text snippet:", summaryError.message);
          summary = sanitizeText(text.substring(0, 500));
        }

        // Basic field extraction from text
        const fields: ExtractedField[] = [];
        const extractedData: any = {
          doc_type: "document",
          raw_text_snippet: sanitizeText(text.substring(0, 1000)),
        };

        // Try to extract basic patterns
        const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.7 });
          extractedData.recipient_email = emailMatch[0];
        }

        const dateMatch = text.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);
        if (dateMatch) {
          fields.push({ key: "date", value: dateMatch[0], confidence: 0.6 });
          extractedData.invoice_date = dateMatch[0];
        }

        return {
          fields,
          extractedData: sanitizeExtractedData(extractedData),
          summary: sanitizeText(summary),
          ocrText: sanitizeText(text),
          ocrConfidence: 0.9,
        };
      } catch (docxError: any) {
        console.error("❌ DOCX parsing error:", docxError);
        return {
          fields: [],
          error: `Failed to parse DOCX file: ${docxError.message || "Unknown error"}`,
        };
      }
    }

    // For other text-based formats - try to read as text
    try {
      const text = sanitizeText(fileBuffer.toString("utf-8"));
      if (text.length > 0 && !text.match(/^PK\x03\x04/)) {
        // Check if it's not a ZIP file (DOCX/other Office formats start with PK)
        // Use Bytez for summarization
        let summary = text.substring(0, 500);
        try {
          const bytezSummary = await generateDialogueSummary({ text: text.substring(0, 2000) });
          if (!bytezSummary.error && bytezSummary.summary) {
            summary = sanitizeText(bytezSummary.summary);
            console.log("✅ Bytez summary generated for document");
          }
        } catch (summaryError) {
          console.warn("⚠️ Bytez summary failed, using text snippet:", summaryError);
        }

        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "document",
            raw_text_snippet: text.substring(0, 1000),
          }),
          summary: sanitizeText(summary),
        };
      }
    } catch (textError) {
      // Not a text file, continue to error
    }

    return {
      fields: [],
      error: `Unsupported file type: ${mimeType}. Supported types: text files, images (PNG/JPG), and PDFs.`,
    };
  } catch (error: any) {
    console.error("📄 Document Analysis Error:", error);
    return {
      fields: [],
      error: error.message || "Failed to analyze document",
    };
  }
}
