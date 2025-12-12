import OpenAI from "openai";

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ExtractedData {
  doc_type?: string;
  issuer?: string;
  account_number?: string;
  invoice_date?: string;
  due_date?: string;
  amount_due?: { value: number; currency: string } | null;
  line_items?: Array<{ description: string; qty: number; unit_price: number; total: number }>;
  recipient_name?: string;
  recipient_email?: string;
  raw_text_snippet?: string;
}

export interface SuggestedActions {
  summary: { summary: string };
  autofill: {
    form_mapping: Record<string, string | number | null>;
    confidence: number;
    missing_fields: string[];
  };
  email: {
    subject: string;
    body: string;
  };
  tasks: {
    tasks: Array<{
      title: string;
      description: string;
      due_date: string;
      priority: "low" | "medium" | "high";
      estimated_time_minutes: number;
    }>;
  };
}

// Parse JSON response helper function (moved to top to avoid hoisting issues)
const parseJsonResponse = (content: string) => {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    return {};
  }
};

/**
 * Simple heuristic summarizer - last resort fallback when AI services are unavailable
 * Uses first few meaningful sentences from the document
 */
function simpleHeuristicSummary(text: string, extracted: ExtractedData): string {
  if (!text || text.trim().length === 0) {
    const docType = extracted.doc_type || "document";
    return `This is a ${docType}. No text content was extracted.`;
  }
  
  // Split into sentences (simple heuristic)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 20) // Filter out very short fragments
    .slice(0, 3); // Take first 3 meaningful sentences
  
  if (sentences.length > 0) {
    let summary = sentences.join(" ");
    
    // Add extracted data hints if available
    if (extracted.issuer) {
      summary += ` Issuer: ${extracted.issuer}.`;
    }
    if (extracted.amount_due) {
      summary += ` Amount: ${extracted.amount_due.currency || ""} ${extracted.amount_due.value}.`;
    }
    if (extracted.invoice_date) {
      summary += ` Date: ${extracted.invoice_date}.`;
    }
    
    return summary;
  }
  
  // Fallback: use first 200 chars
  return text.substring(0, 200) + (text.length > 200 ? "..." : "");
}

export async function generateSuggestedActions(
  extracted: ExtractedData,
  rawText?: string
): Promise<SuggestedActions> {
  const extractedJson = JSON.stringify(extracted, null, 2);
  const contextText = rawText || extracted.raw_text_snippet || "";

  // Generate Summary using ApyHub (primary), fallback to OpenAI
  let summaryText = "";
  let summaryResponse: any;
  
  try {
    console.log("📝 Using ApyHub for document summarization");
    // Prepare text for summarization - combine extracted data and document text
    const textToSummarize = `Document Content:\n${contextText}\n\nExtracted Information:\n${extractedJson}`;
    
    const { isApyHubAvailable, summarizeLargeText } = await import("./apyhubService");
    const { uploadTextForApyHub } = await import("./storageHelper");
    
    if (isApyHubAvailable() && textToSummarize.length > 100) {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
      const apyhubResult = await summarizeLargeText(
        textToSummarize,
        (buffer, filename) => uploadTextForApyHub(buffer, filename, serverUrl),
        { summary_length: "medium", output_language: "en" }
      );
      
      if (apyhubResult.error) {
        console.warn("⚠️ ApyHub summary failed, falling back to OpenAI:", apyhubResult.error);
        throw new Error(apyhubResult.error);
      }
      
      summaryText = apyhubResult.summary || "";
      console.log("✅ ApyHub summary generated successfully");
      
      // Format summary response to match expected structure
      summaryResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ summary: summaryText })
          }
        }]
      };
    } else {
      throw new Error("ApyHub not available or text too short");
    }
  } catch (apyhubError: any) {
    const errorMessage = apyhubError?.message || String(apyhubError);
    const isPlanError = errorMessage.includes("not on a plan") || errorMessage.includes("plan");
    
    if (isPlanError) {
      console.warn("⚠️ ApyHub plan/quota error - using fallback summarizer");
    } else {
      console.warn("⚠️ ApyHub summary failed, falling back:", errorMessage);
    }
    
    // Fallback to OpenAI if Bytez fails
    if (!openai) {
      console.warn("⚠️ Bytez failed and OpenAI not available, using heuristic summary");
      summaryText = simpleHeuristicSummary(contextText, extracted);
      summaryResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ summary: summaryText })
          }
        }]
      };
    } else {
      console.log("🔄 Falling back to OpenAI for summary generation");
      summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an executive summarizer. Input: full text of document + extracted_json.
Output: a short 2–4 sentence summary suitable for showing to a user. Include key numbers/dates and 1 recommended next-step.

Format:
{
  "summary": "..."
}

Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: `Extracted data:\n${extractedJson}\n\nDocument text:\n${contextText.substring(0, 2000)}\n\nGenerate a summary.`,
          },
        ],
        max_tokens: 300,
      });
      
      summaryText = summaryResponse.choices[0]?.message?.content || "";
    }
  }

  // Generate Autofill Mapping (requires OpenAI)
  if (!openai) {
    // Return summary only if OpenAI is not available
    return {
      summary: parseJsonResponse(summaryResponse.choices[0]?.message?.content || "{}"),
      autofill: { form_mapping: {}, confidence: 0, missing_fields: [] },
      email: { subject: "", body: "" },
      tasks: { tasks: [] },
    };
  }

  const formSchema = [
    { name: "payer_name", type: "string" },
    { name: "account_number", type: "string" },
    { name: "amount", type: "number" },
    { name: "date", type: "string" },
    { name: "due_date", type: "string" },
    { name: "invoice_number", type: "string" },
    { name: "notes", type: "string" },
  ];

  const autofillResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a form mapper. Input: 1) extracted_json, 2) target form schema (list of fields with names and types).
Output: JSON mapping of form_field_name -> suggested_value. If field cannot be mapped, return null and an explanation.

Example output:
{
  "form_mapping": {
    "payer_name": "ABC Pvt Ltd",
    "account_number": "12345",
    "amount": "1234.56",
    "date": "2025-12-01",
    "notes": null
  },
  "confidence": 0.87,
  "missing_fields": ["bank_ifsc"]
}

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Extracted data:\n${extractedJson}\n\nForm schema:\n${JSON.stringify(formSchema, null, 2)}\n\nGenerate form mapping.`,
      },
    ],
    max_tokens: 500,
  });

  // Generate Email Draft
  // Use the summaryText from the summary generation above
  const emailResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional email writer. Input: extracted_json, summary, user tone preference (e.g., formal, friendly). Output: JSON:
{
  "subject": "...",
  "body": "Dear X,\n\n ...\n\nRegards,\n[User Name]"
}

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Extracted data:\n${extractedJson}\n\nSummary:\n${summaryText}\n\nTone: professional and friendly. Generate email draft.`,
      },
    ],
    max_tokens: 500,
  });

  // Generate Tasks
  const tasksResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a task planner. Input: extracted_json and summary. Output: JSON array of tasks with fields: title, description, due_date, priority, estimated_time_minutes.

Example:
{
  "tasks": [
    {"title": "Pay invoice ACME 123", "description": "Pay ₹1234.56 via netbanking. Account: xxxxx", "due_date": "2025-12-10", "priority": "high", "estimated_time_minutes": 10}
  ]
}

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Extracted data:\n${extractedJson}\n\nSummary:\n${summaryText}\n\nGenerate tasks.`,
      },
    ],
    max_tokens: 500,
  });

  return {
    summary: parseJsonResponse(summaryResponse.choices[0]?.message?.content || "{}"),
    autofill: parseJsonResponse(autofillResponse.choices[0]?.message?.content || "{}"),
    email: parseJsonResponse(emailResponse.choices[0]?.message?.content || "{}"),
    tasks: parseJsonResponse(tasksResponse.choices[0]?.message?.content || "{}"),
  };
}

