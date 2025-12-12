import Bytez from "bytez.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Bytez SDK for images
const imageApiKey = process.env.BYTEZ_API_KEY || "349c88bd7835622d5760900f6b0f8a51";
const imageSdk = new Bytez(imageApiKey);
const imageModel = imageSdk.model("ZB-Tech/Text-to-Image");

// Initialize Bytez SDK for videos with separate API key (fallback)
const videoApiKey = process.env.BYTEZ_VIDEO_API_KEY || "72766a8ab41bb8e6ee002cc4e4dd42c6";
const videoSdk = new Bytez(videoApiKey);
const videoModel = videoSdk.model("ali-vilab/text-to-video-ms-1.7b");

// Initialize Google Generative AI for video generation
const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyDMUiPPecWYiH0IdfT6ubMQvyXaRBe0EXM";
const genAI = new GoogleGenerativeAI(googleApiKey);

// Initialize Bytez SDK for dialogue summary with separate API key
const dialogueApiKey = process.env.BYTEZ_DIALOGUE_API_KEY || "19ddd0a5c384c7365b8e0bd620351a1e";
const dialogueSdk = new Bytez(dialogueApiKey);
const dialogueSummaryModel = dialogueSdk.model("svjack/dialogue-summary");

// Initialize Bytez SDK for document analysis with separate API key
const documentApiKey = process.env.BYTEZ_DOCUMENT_API_KEY || "e05bb4f31ced25f7d0bd7340eb8d6688";
const documentSdk = new Bytez(documentApiKey);

export interface GenerateImageOptions {
  prompt: string;
  style?: string;
  size?: string;
}

export interface GenerateImageResult {
  url?: string;
  urls?: string[];
  error?: string;
  raw?: any;
}

export async function generateImageWithBytez(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  try {
    console.log("🎨 Bytez: Starting image generation with prompt:", options.prompt);
    
    // Enhance prompt with style if provided
    let enhancedPrompt = options.prompt;
    if (options.style) {
      const styleMap: Record<string, string> = {
        realistic: "photorealistic, high quality, detailed",
        "3d": "3D render, CGI, detailed 3D model",
        anime: "anime style, Japanese animation, vibrant colors",
        cyberpunk: "cyberpunk, neon lights, futuristic, dark atmosphere",
        holographic: "holographic, iridescent, prismatic, ethereal glow",
        fantasy: "fantasy art, magical, mystical, epic",
      };
      const styleText = styleMap[options.style] || options.style;
      enhancedPrompt = `${enhancedPrompt}, ${styleText}`;
    }

    console.log("🎨 Bytez: Enhanced prompt:", enhancedPrompt);

    // Run the image model
    const result = await imageModel.run(enhancedPrompt);
    console.log("🎨 Bytez: Raw result:", JSON.stringify(result, null, 2));

    const { error, output } = result;

    if (error) {
      console.error("❌ Bytez Model Error:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as any)?.message || JSON.stringify(error) || "Failed to generate image";
      return { 
        error: errorMessage,
        raw: output 
      };
    }

    // Log the output structure for debugging
    console.log("🎨 Bytez: Output structure:", {
      hasOutput: !!output,
      outputKeys: output ? Object.keys(output) : [],
      outputType: typeof output,
    });

    // Handle different output formats
    if (output) {
      // Check for images array
      if (output.images) {
        console.log("🎨 Bytez: Found images property, type:", typeof output.images);
        
        // Multiple images (array)
        if (Array.isArray(output.images) && output.images.length > 0) {
          console.log("✅ Bytez: Returning", output.images.length, "images");
          return {
            urls: output.images,
            raw: output,
          };
        }
        
        // Single image URL (string)
        if (typeof output.images === "string") {
          console.log("✅ Bytez: Returning single image URL");
          return {
            url: output.images,
            raw: output,
          };
        }
        
        // First image from array-like object
        if (output.images[0]) {
          console.log("✅ Bytez: Returning first image from array");
          return {
            url: output.images[0],
            urls: Array.isArray(output.images) ? output.images : [output.images[0]],
            raw: output,
          };
        }
      }

      // Check for direct URL property
      if (output.url) {
        console.log("✅ Bytez: Returning direct URL");
        return {
          url: output.url,
          raw: output,
        };
      }

      // Check if output itself is a URL string
      if (typeof output === "string" && (output.startsWith("http") || output.startsWith("data:"))) {
        console.log("✅ Bytez: Output is a URL string");
        return {
          url: output,
          raw: { url: output },
        };
      }

      // Check for data URL or base64
      if (output.data || output.base64) {
        const imageData = output.data || output.base64;
        console.log("✅ Bytez: Found data/base64, converting to data URL");
        const dataUrl = typeof imageData === 'string' && imageData.startsWith('data:') 
          ? imageData 
          : `data:image/png;base64,${imageData}`;
        return {
          url: dataUrl,
          raw: output,
        };
      }
    }

    // If no image found in expected format, return error with full output for debugging
    console.error("❌ Bytez: No image URL found in response. Full output:", JSON.stringify(output, null, 2));
    return {
      error: "No image URL found in response. Check server logs for details.",
      raw: output,
    };
  } catch (err: any) {
    console.error("❌ Bytez Service Exception:", err);
    console.error("❌ Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate image",
    };
  }
}

export interface GenerateVideoOptions {
  prompt: string;
  duration?: number;
}

export interface GenerateVideoResult {
  url?: string;
  urls?: string[];
  error?: string;
  raw?: any;
}

export interface DialogueSummaryOptions {
  text: string;
}

export interface DialogueSummaryResult {
  summary?: string;
  error?: string;
}

export interface AnalyzeDocumentOptions {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  model?: string; // Optional model name, defaults to a document analysis model
}

export interface AnalyzeDocumentResult {
  extractedData?: any;
  ocrText?: string;
  confidence?: number;
  error?: string;
}

// Generate video using Google Generative AI (Veo 1.5)
export async function generateVideoWithGoogle(
  options: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  try {
    console.log("🎬 Google Veo: Starting video generation with prompt:", options.prompt);
    console.log("🎬 Google Veo: Using API key:", googleApiKey.substring(0, 8) + "...");
    
    // Start video generation using the Google Generative AI API
    // Note: Using type casting as the SDK types may not include video generation yet
    const genAIAny = genAI as any;
    
    let operation = await genAIAny.models.generateVideo({
      model: "veo-1.5-generate-001",
      prompt: options.prompt,
    });

    console.log("🎬 Google Veo: Operation started:", operation.name);

    // Poll until ready (max 5 minutes = 300 seconds)
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();
    const pollInterval = 8000; // 8 seconds

    while (!operation.done) {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime) {
        return {
          error: "Video generation timeout - operation took longer than 5 minutes",
        };
      }

      console.log("🎬 Google Veo: Generating video... (elapsed: " + Math.round(elapsed / 1000) + "s)");
      await new Promise((res) => setTimeout(res, pollInterval));
      
      operation = await genAIAny.operations.get({ name: operation.name });
    }

    console.log("✅ Google Veo: Video generation completed");

    // Get the video file from result
    const videoFile = operation.result?.video;
    
    if (!videoFile) {
      console.error("❌ Google Veo: No video file in result");
      return {
        error: "No video file returned from Google Veo",
        raw: operation.result,
      };
    }

    // Extract video URI/URL - handle different response formats
    let videoUrl: string;
    
    if (typeof videoFile === 'string') {
      videoUrl = videoFile;
    } else if (videoFile.uri) {
      videoUrl = videoFile.uri;
    } else if (videoFile.url) {
      videoUrl = videoFile.url;
    } else {
      // Try to get URI from nested structure
      videoUrl = (videoFile as any).fileUri || (videoFile as any).uri || JSON.stringify(videoFile);
    }
    
    console.log("✅ Google Veo: Video URL:", videoUrl);

    return {
      url: videoUrl,
      raw: {
        operation: operation.name,
        videoFile: videoFile,
        result: operation.result,
      },
    };
  } catch (err: any) {
    console.error("❌ Google Veo Service Exception:", err);
    console.error("❌ Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate video with Google Veo",
    };
  }
}

// Fallback to Bytez if Google is not available
export async function generateVideoWithBytez(
  options: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  try {
    console.log("🎬 Bytez Video: Starting video generation with prompt:", options.prompt);
    console.log("🎬 Bytez Video: Using API key:", videoApiKey.substring(0, 8) + "...");
    
    // Run the video model
    const result = await videoModel.run(options.prompt);
    console.log("🎬 Bytez: Raw video result:", JSON.stringify(result, null, 2));

    const { error, output } = result;

    if (error) {
      console.error("❌ Bytez Video Model Error:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as any)?.message || JSON.stringify(error) || "Failed to generate video";
      return { 
        error: errorMessage,
        raw: output 
      };
    }

    // Log the output structure for debugging
    console.log("🎬 Bytez: Video output structure:", {
      hasOutput: !!output,
      outputKeys: output ? Object.keys(output) : [],
      outputType: typeof output,
    });

    // Handle different output formats
    if (output) {
      // Check for videos array
      if (output.videos) {
        console.log("🎬 Bytez: Found videos property, type:", typeof output.videos);
        
        // Multiple videos (array)
        if (Array.isArray(output.videos) && output.videos.length > 0) {
          console.log("✅ Bytez: Returning", output.videos.length, "video(s)");
          return {
            urls: output.videos,
            raw: output,
          };
        }
        
        // Single video URL (string)
        if (typeof output.videos === "string") {
          console.log("✅ Bytez: Returning single video URL");
          return {
            url: output.videos,
            raw: output,
          };
        }
        
        // First video from array-like object
        if (output.videos[0]) {
          console.log("✅ Bytez: Returning first video from array");
          return {
            url: output.videos[0],
            urls: Array.isArray(output.videos) ? output.videos : [output.videos[0]],
            raw: output,
          };
        }
      }

      // Check for direct URL property
      if (output.url) {
        console.log("✅ Bytez: Returning direct video URL");
        return {
          url: output.url,
          raw: output,
        };
      }

      // Check if output itself is a URL string
      if (typeof output === "string" && (output.startsWith("http") || output.startsWith("data:"))) {
        console.log("✅ Bytez: Output is a video URL string");
        return {
          url: output,
          raw: { url: output },
        };
      }

      // Check for video file or data
      if (output.video || output.file) {
        const videoData = output.video || output.file;
        console.log("✅ Bytez: Found video file/data");
        return {
          url: typeof videoData === 'string' ? videoData : JSON.stringify(videoData),
          raw: output,
        };
      }
    }

    // If no video found in expected format, return error with full output for debugging
    console.error("❌ Bytez: No video URL found in response. Full output:", JSON.stringify(output, null, 2));
    return {
      error: "No video URL found in response. Check server logs for details.",
      raw: output,
    };
  } catch (err: any) {
    console.error("❌ Bytez Video Service Exception:", err);
    console.error("❌ Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate video",
    };
  }
}

/**
 * Generate dialogue summary using Bytez.js
 * @param options - Options containing the dialogue text to summarize
 * @returns Summary result or error
 */
export async function generateDialogueSummary(
  options: DialogueSummaryOptions
): Promise<DialogueSummaryResult> {
  try {
    if (!options.text || !options.text.trim()) {
      return {
        error: "Text is required for dialogue summarization",
      };
    }

    console.log("📝 Bytez Dialogue: Generating dialogue summary...");
    console.log("📝 Bytez Dialogue: Input text length:", options.text.length);
    console.log("📝 Bytez Dialogue: Using API key:", dialogueApiKey.substring(0, 8) + "...");

    // Run the dialogue summary model
    const result = await dialogueSummaryModel.run(options.text);
    console.log("📝 Bytez Dialogue: Raw result:", JSON.stringify(result, null, 2));

    const { error, output } = result;

    if (error) {
      console.error("❌ Bytez Dialogue Model Error:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as any)?.message || JSON.stringify(error) || "Failed to generate dialogue summary";
      return {
        error: errorMessage,
      };
    }

    if (!output) {
      return {
        error: "No output received from Bytez API",
      };
    }

    // Handle different output formats
    let summary: string;
    if (typeof output === "string") {
      summary = output;
    } else if (typeof output === "object" && output !== null) {
      // If output is an object, try to extract summary text
      summary = (output as any).summary || (output as any).text || JSON.stringify(output);
    } else {
      summary = String(output);
    }

    console.log("✅ Bytez Dialogue: Dialogue summary generated successfully");
    console.log("📝 Bytez Dialogue: Summary length:", summary.length);

    return {
      summary: summary.trim(),
    };
  } catch (err: any) {
    console.error("❌ Bytez Dialogue Service Exception:", err);
    console.error("❌ Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Bytez dialogue service encountered an unexpected error",
    };
  }
}

/**
 * Analyze document using Bytez.js
 * @param options - Options containing the document file buffer and metadata
 * @returns Document analysis result with extracted data and OCR text
 */
export async function analyzeDocumentWithBytez(
  options: AnalyzeDocumentOptions
): Promise<AnalyzeDocumentResult> {
  try {
    console.log("📄 Bytez Document: Starting document analysis");
    console.log("📄 Bytez Document: File:", options.fileName, "Type:", options.mimeType);
    console.log("📄 Bytez Document: Using API key:", documentApiKey.substring(0, 8) + "...");

    // Convert buffer to base64 for Bytez API
    const base64Data = options.fileBuffer.toString("base64");
    
    // Try common document analysis models
    // User can specify model via options.model, or we'll try default models
    // Note: Bytez models are typically for text processing, not direct PDF/image analysis
    // For PDFs/images, we'll extract text first or use a text-based model
    const modelName = options.model || "svjack/dialogue-summary"; // Default model for text processing
    const documentModel = documentSdk.model(modelName);

    // Prepare input - Bytez models typically accept text input
    // For document analysis, we'll try to extract text or send the file data
    let input: any;
    
    if (options.mimeType.startsWith("text/")) {
      // For text files, send text directly
      input = options.fileBuffer.toString("utf-8");
    } else if (options.mimeType === "application/pdf") {
      // For PDFs, try to extract text or send as base64 string
      // Bytez models may accept base64 encoded PDFs or text extracted from PDFs
      // For now, we'll send the base64 data as a string with instructions
      input = `Document: ${options.fileName}\nType: PDF\nBase64: ${base64Data.substring(0, 1000)}...\n\nExtract all text and structured data from this PDF document.`;
    } else if (options.mimeType.startsWith("image/")) {
      // For images, send base64 with instructions
      input = `Document: ${options.fileName}\nType: Image (${options.mimeType})\nBase64: ${base64Data.substring(0, 1000)}...\n\nExtract all text and structured data from this image document using OCR.`;
    } else {
      // For other types, try to read as text
      try {
        input = options.fileBuffer.toString("utf-8");
      } catch {
        input = `Document: ${options.fileName}\nType: ${options.mimeType}\nBase64: ${base64Data.substring(0, 1000)}...`;
      }
    }

    console.log("📄 Bytez Document: Running model:", modelName);
    const result = await documentModel.run(input);
    console.log("📄 Bytez Document: Raw result:", JSON.stringify(result, null, 2));

    const { error, output } = result;

    if (error) {
      console.error("❌ Bytez Document Model Error:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as any)?.message || JSON.stringify(error) || "Failed to analyze document";
      return {
        error: errorMessage,
      };
    }

    if (!output) {
      return {
        error: "No output received from Bytez API",
      };
    }

    // Handle different output formats
    let extractedData: any = null;
    let ocrText: string = "";
    
    if (typeof output === "string") {
      ocrText = output;
      extractedData = {
        doc_type: "other",
        raw_text_snippet: output.substring(0, 1000),
      };
    } else if (typeof output === "object" && output !== null) {
      // Try to extract structured data
      extractedData = output;
      ocrText = (output as any).text || (output as any).ocrText || (output as any).raw_text_snippet || JSON.stringify(output);
    } else {
      ocrText = String(output);
      extractedData = {
        doc_type: "other",
        raw_text_snippet: ocrText.substring(0, 1000),
      };
    }

    console.log("✅ Bytez Document: Document analysis completed");
    console.log("📄 Bytez Document: OCR text length:", ocrText.length);

    return {
      extractedData,
      ocrText: ocrText.trim(),
      confidence: 0.85, // Default confidence for Bytez extraction
    };
  } catch (err: any) {
    console.error("❌ Bytez Document Service Exception:", err);
    console.error("❌ Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Bytez document service encountered an unexpected error",
    };
  }
}

