import fetch from "node-fetch";

// Initialize ApyHub client
const apyhubToken = process.env.APYHUB_TOKEN || "APY029h8vlKrlVGl9FqqkRLSmZy2zwsXr5yc5aMbCa5rWQCMsfaKgunMsr4BH0BTmHpsEgO3O";
const baseUrl = "https://api.apyhub.com";

export interface SummarizeUrlOptions {
  url: string;
  summary_length?: "short" | "medium" | "long";
  output_language?: string; // ISO language code (e.g., "en", "hi", "es")
}

export interface SummarizeTextOptions {
  text: string;
  summary_length?: "short" | "medium" | "long";
  output_language?: string;
}

export interface SummarizeResult {
  summary?: string;
  error?: string;
}

/**
 * Check if ApyHub API is available
 */
export function isApyHubAvailable(): boolean {
  return !!apyhubToken && apyhubToken.length > 0;
}

/**
 * Summarize content from a URL using ApyHub
 */
export async function summarizeUrl(
  options: SummarizeUrlOptions
): Promise<SummarizeResult> {
  try {
    if (!isApyHubAvailable()) {
      return {
        error: "ApyHub API token is not configured. Please set APYHUB_TOKEN in your environment variables.",
      };
    }

    console.log("📝 ApyHub: Starting URL summarization");
    console.log("📝 ApyHub: URL:", options.url.substring(0, 100));
    console.log("📝 ApyHub: Summary length:", options.summary_length || "medium");
    console.log("📝 ApyHub: Output language:", options.output_language || "en");

    const requestBody = {
      url: options.url,
      summary_length: options.summary_length || "medium",
      output_language: options.output_language || "en",
    };

    const response = await fetch(`${baseUrl}/ai/summarize-url`, {
      method: "POST",
      headers: {
        "apy-token": apyhubToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `ApyHub API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error("❌ ApyHub API Error:", errorMessage);
      return { error: errorMessage };
    }

    const data = await response.json();
    const summary = data.data?.summary || data.summary || "";

    if (!summary) {
      console.warn("⚠️ ApyHub: No summary content in response");
      return {
        error: "No summary content received from ApyHub API",
      };
    }

    console.log("✅ ApyHub: URL summarization completed");
    console.log("📝 ApyHub: Summary length:", summary.length);

    return { summary };
  } catch (error: any) {
    console.error("❌ ApyHub Service Error:", error);
    return {
      error: error.message || "ApyHub service encountered an unexpected error",
    };
  }
}

/**
 * Split text into chunks for processing large documents
 * Uses overlapping chunks to maintain context
 */
export function splitTextIntoChunks(
  text: string,
  maxChars: number = 10000,
  overlap: number = 500
): string[] {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    const start = Math.max(0, i - overlap);
    const chunk = text.slice(start, start + maxChars);
    chunks.push(chunk);
    i += maxChars - overlap;
  }

  return chunks;
}

/**
 * Summarize text by first uploading it to storage and then calling summarize-url
 * This is a workaround if ApyHub only supports URL-based summarization
 */
export async function summarizeTextViaUrl(
  text: string,
  uploadToStorage: (buffer: Buffer, filename: string) => Promise<string>,
  options: Omit<SummarizeUrlOptions, "url"> = {}
): Promise<SummarizeResult> {
  try {
    // Upload text as a temporary file to storage
    const filename = `doc-summary-${Date.now()}.txt`;
    const textBuffer = Buffer.from(text, "utf-8");
    
    console.log("📝 ApyHub: Uploading text to storage for summarization");
    const url = await uploadToStorage(textBuffer, filename);
    
    console.log("📝 ApyHub: Text uploaded, URL:", url);
    
    // Now summarize the URL
    return await summarizeUrl({
      url,
      ...options,
    });
  } catch (error: any) {
    console.error("❌ ApyHub: Error in summarizeTextViaUrl:", error);
    return {
      error: error.message || "Failed to summarize text via URL",
    };
  }
}

/**
 * Summarize large text by chunking and merging summaries
 */
export async function summarizeLargeText(
  text: string,
  uploadToStorage: (buffer: Buffer, filename: string) => Promise<string>,
  options: Omit<SummarizeUrlOptions, "url"> = {}
): Promise<SummarizeResult> {
  try {
    // Check if text needs chunking (~12k words = ~8000 chars is safe)
    const maxChars = 8000;
    
    if (text.length <= maxChars) {
      // Small enough, summarize directly
      return await summarizeTextViaUrl(text, uploadToStorage, options);
    }

    console.log("📝 ApyHub: Text is large, chunking for summarization");
    console.log("📝 ApyHub: Text length:", text.length, "chars");

    // Split into chunks
    const chunks = splitTextIntoChunks(text, maxChars, 500);
    console.log("📝 ApyHub: Split into", chunks.length, "chunks");

    // Summarize each chunk
    const chunkSummaries: string[] = [];
    for (const [idx, chunk] of chunks.entries()) {
      console.log(`📝 ApyHub: Summarizing chunk ${idx + 1}/${chunks.length}`);
      
      const chunkResult = await summarizeTextViaUrl(
        chunk,
        uploadToStorage,
        { ...options, summary_length: "short" } // Use short for chunks
      );

      if (chunkResult.error) {
        console.warn(`⚠️ ApyHub: Chunk ${idx + 1} summarization failed:`, chunkResult.error);
        continue;
      }

      if (chunkResult.summary) {
        chunkSummaries.push(chunkResult.summary);
      }
    }

    if (chunkSummaries.length === 0) {
      return {
        error: "Failed to summarize any chunks",
      };
    }

    // Merge chunk summaries
    const mergedText = chunkSummaries.join("\n\n");
    console.log("📝 ApyHub: Merging", chunkSummaries.length, "chunk summaries");

    // If merged text is still large, summarize it again
    if (mergedText.length > maxChars) {
      return await summarizeLargeText(mergedText, uploadToStorage, options);
    }

    // Final summary of merged chunks
    return await summarizeTextViaUrl(mergedText, uploadToStorage, {
      ...options,
      summary_length: options.summary_length || "medium",
    });
  } catch (error: any) {
    console.error("❌ ApyHub: Error in summarizeLargeText:", error);
    return {
      error: error.message || "Failed to summarize large text",
    };
  }
}

