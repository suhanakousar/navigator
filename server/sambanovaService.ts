import fetch from "node-fetch";

// Initialize SambaNova AI client
const sambanovaApiKey = process.env.SAMBANOVA_API_KEY || "c8238532-f38b-4180-8ab1-bae5a4f1fd30";
const baseUrl = "https://api.sambanova.ai/v1";

export interface ChatCompletionOptions {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResult {
  message?: string;
  error?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Check if SambaNova API is available
 */
export function isSambaNovaAvailable(): boolean {
  return !!sambanovaApiKey && sambanovaApiKey.length > 0;
}

/**
 * Generate chat completion using SambaNova AI
 */
export async function generateChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  try {
    if (!isSambaNovaAvailable()) {
      return {
        error: "SambaNova API key is not configured. Please set SAMBANOVA_API_KEY in your environment variables.",
      };
    }

    console.log("🤖 SambaNova: Starting chat completion");
    console.log("🤖 SambaNova: Model:", options.model || "ALLaM-7B-Instruct-preview");
    console.log("🤖 SambaNova: Messages count:", options.messages.length);

    const requestBody = {
      model: options.model || "ALLaM-7B-Instruct-preview",
      messages: options.messages,
      stream: options.stream || false,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sambanovaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `SambaNova API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error("❌ SambaNova API Error:", errorMessage);
      return { error: errorMessage };
    }

    const data = await response.json();
    
    console.log("🤖 SambaNova: Raw API response structure:", JSON.stringify(Object.keys(data), null, 2));
    if (data.choices) {
      console.log("🤖 SambaNova: Choices count:", data.choices.length);
      if (data.choices[0]) {
        console.log("🤖 SambaNova: First choice structure:", JSON.stringify(Object.keys(data.choices[0]), null, 2));
      }
    }

    // Handle streaming response (if stream: true)
    if (options.stream && data.stream) {
      // For now, we'll handle non-streaming. Streaming can be added later if needed
      console.warn("⚠️ Streaming response not fully implemented yet, using non-streaming");
    }

    // Extract message from response - try multiple possible formats
    let message = "";
    if (data.choices && data.choices[0]) {
      message = data.choices[0].message?.content || data.choices[0].text || "";
    }
    if (!message) {
      message = data.content || data.text || data.message || "";
    }
    
    const usage = data.usage || {};

    if (!message) {
      console.warn("⚠️ SambaNova: No message content in response");
      console.warn("⚠️ SambaNova: Full response:", JSON.stringify(data, null, 2).substring(0, 1000));
      return {
        error: "No response content received from SambaNova API",
      };
    }

    console.log("✅ SambaNova: Chat completion generated successfully");
    console.log("🤖 SambaNova: Response length:", message.length);
    console.log("🤖 SambaNova: Response preview:", message.substring(0, 200));

    return {
      message,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
    };
  } catch (error: any) {
    console.error("❌ SambaNova Service Error:", error);
    return {
      error: error.message || "SambaNova service encountered an unexpected error",
    };
  }
}

/**
 * Generate text completion (simpler interface for single prompts)
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResult> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  messages.push({ role: "user", content: prompt });

  return generateChatCompletion({
    messages,
    model: "ALLaM-7B-Instruct-preview",
    stream: false,
  });
}

