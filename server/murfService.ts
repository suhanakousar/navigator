import fetch from "node-fetch";
import type { Response } from "node-fetch";

// Murf.ai API configuration
const apiKey = process.env.MURF_API_KEY || "ap2_7416f00f-4e9a-4368-8ca2-707a27a26196";
// Try both endpoints - user provided global.api.murf.ai
const baseUrl = "https://global.api.murf.ai/v1";

// Cache for valid voices
let cachedVoices: any[] | null = null;
let voicesFetchPromise: Promise<any[]> | null = null;

export interface GenerateSpeechOptions {
  text: string;
  voiceId?: string;
  speed?: number; // 0.25 to 4.0 (will be converted to rate)
  pitch?: number; // -50 to 50 (in semitones, will be converted to integer)
  sampleRate?: number; // 8000, 16000, 22050, 24000, 44100, 48000
  format?: "mp3" | "wav" | "pcm";
  model?: string; // e.g., "FALCON"
  multiNativeLocale?: string; // e.g., "en-US"
}

export interface GenerateSpeechResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  error?: string;
  raw?: any;
}

/**
 * Generate speech using Murf.ai API
 * Uses the streaming endpoint for better performance
 */
export async function generateSpeechWithMurf(
  options: GenerateSpeechOptions
): Promise<GenerateSpeechResult> {
  try {
    console.log("🎤 Murf: Starting speech generation with text:", options.text.substring(0, 50) + "...");
    
    let voiceId = options.voiceId;
    
    // Check if voiceId is one of the known invalid formats (hardcoded presets)
    // Valid format is: "en-US-matthew", "en-US-sarah", etc. (locale-name)
    // Invalid formats: "en-US-Neural2-D", "en-US-Neural2-A", etc.
    const invalidVoicePatterns = [
      "en-US-Neural2-D",
      "en-US-Neural2-A", 
      "en-US-Neural2-F",
      "en-US-Neural2-C",
    ];
    
    if (voiceId && invalidVoicePatterns.includes(voiceId)) {
      console.warn(`⚠️ Murf: Detected invalid hardcoded voice ID "${voiceId}", fetching valid voice from API...`);
      voiceId = undefined; // Force fetch from API
    }
    
    // Also check if it's a simple name without locale prefix (like "matthew", "sarah")
    // Convert to proper format: "en-US-matthew"
    if (voiceId && !voiceId.includes("-") && voiceId.length < 15) {
      const simpleName = voiceId.toLowerCase();
      // Map common names to proper format
      const nameToVoiceId: Record<string, string> = {
        "matthew": "en-US-matthew",
        "sarah": "en-US-sarah",
        "james": "en-US-james",
        "michael": "en-US-michael",
      };
      
      if (nameToVoiceId[simpleName]) {
        console.log(`🎤 Murf: Converting simple name "${voiceId}" to proper format "${nameToVoiceId[simpleName]}"`);
        voiceId = nameToVoiceId[simpleName];
      }
    }
    
    // If no voiceId provided, fetch a valid default from the API
    if (!voiceId) {
      console.log("🎤 Murf: No voiceId provided, fetching default...");
      const defaultVoiceId = await getDefaultVoiceId();
      if (defaultVoiceId) {
        voiceId = defaultVoiceId;
        console.log(`🎤 Murf: Using default voice from API: ${voiceId}`);
      } else {
        // Fallback: try to use first cached voice
        if (cachedVoices && cachedVoices.length > 0) {
          const firstVoice = cachedVoices[0];
          voiceId = firstVoice.id || firstVoice.voiceId || firstVoice.voice_id;
          if (voiceId) {
            console.log(`🎤 Murf: Using first cached voice: ${voiceId}`);
          }
        }
        
        if (!voiceId) {
          // Last resort: try to fetch voices one more time
          console.log("🎤 Murf: No voice ID found, attempting to fetch voices again...");
          const result = await getMurfVoices();
          if (result.voices && result.voices.length > 0) {
            const firstVoice = result.voices[0];
            voiceId = firstVoice.id || firstVoice.voiceId || firstVoice.voice_id;
            if (voiceId) {
              console.log(`🎤 Murf: Found voice after retry: ${voiceId}`);
            }
          }
        }
        
        if (!voiceId) {
          // Last resort: use a common default voice ID format (from API docs)
          voiceId = "en-US-matthew";
          console.log(`🎤 Murf: Using fallback default voice ID: ${voiceId}`);
        }
      }
    }
    
    // If voiceId looks like a simple name, try to find it in cached voices
    if (voiceId && !voiceId.includes("-") && !voiceId.includes("_") && voiceId.length < 15) {
      const searchName = voiceId.toLowerCase();
      
      // Try to find voice by name in cached voices
      if (cachedVoices && cachedVoices.length > 0) {
        const foundVoice = cachedVoices.find(
          (v: any) => v.name?.toLowerCase() === searchName ||
                 v.voiceName?.toLowerCase() === searchName
        );
        if (foundVoice) {
          const foundId = foundVoice.id || foundVoice.voiceId || foundVoice.voice_id;
          if (foundId) {
            voiceId = foundId;
            console.log(`🎤 Murf: Found voice by name, using ID: ${voiceId}`);
          }
        }
      }
      
      // If still not found, fetch voices and try again
      if (!cachedVoices || cachedVoices.length === 0) {
        await getMurfVoices();
        if (cachedVoices && cachedVoices.length > 0) {
          const foundVoice = cachedVoices.find(
            (v: any) => v.name?.toLowerCase() === searchName ||
                   v.voiceName?.toLowerCase() === searchName
          );
          if (foundVoice) {
            const foundId = foundVoice.id || foundVoice.voiceId || foundVoice.voice_id;
            if (foundId) {
              voiceId = foundId;
              console.log(`🎤 Murf: Found voice by name after fetch, using ID: ${voiceId}`);
            }
          }
        }
      }
      
      // If still not found, try to get a default voice
      if (!voiceId || (voiceId.length < 15 && !voiceId.includes("-") && !voiceId.includes("_"))) {
        const defaultVoiceId = await getDefaultVoiceId();
        if (defaultVoiceId) {
          console.warn(`⚠️ Murf: Voice "${options.voiceId}" not found, using default: ${defaultVoiceId}`);
          voiceId = defaultVoiceId;
        } else {
          return {
            error: `Invalid voice ID: "${options.voiceId}". Please use a valid voice ID from /api/voice/voices.`,
          };
        }
      }
    }
    
    // Ensure we have a valid voiceId at this point
    // If still no voiceId, use the default from API docs
    if (!voiceId || voiceId.trim() === "") {
      console.warn("⚠️ Murf: No voice ID provided, using default: en-US-matthew");
      voiceId = "en-US-matthew";
    }
    
    console.log(`🎤 Murf: Final voice ID to use: "${voiceId}"`);
    
    // Prepare request body according to API spec
    // Required fields: text, voiceId
    // Format: "en-US-matthew", "en-US-sarah", etc.
    const requestBody: any = {
      text: options.text,
      voiceId: voiceId.trim(), // Ensure no whitespace
      multiNativeLocale: options.multiNativeLocale || "en-US",
      model: options.model || "FALCON",
      format: (options.format || "MP3").toUpperCase(),
      sampleRate: options.sampleRate || 24000,
      channelType: "MONO",
    };
    // Convert speed to rate (integer)
    // Frontend sends speed as 0.5-2.0 (50%-200%), API expects rate as integer in range -50 to 50
    // Where: speed 1.0 → rate 0 (normal), speed 0.5 → rate -50 (slowest), speed 2.0 → rate 50 (fastest)
    if (options.speed !== undefined) {
      // Normalize speed to 0.5-2.0 range (in case frontend sends percentage or out-of-range values)
      let normalizedSpeed = options.speed;
      
      // If speed is > 10, it's likely a percentage (50-200), convert to decimal
      if (normalizedSpeed > 10) {
        normalizedSpeed = normalizedSpeed / 100;
      }
      
      // Clamp speed to valid range 0.5-2.0
      normalizedSpeed = Math.max(0.5, Math.min(2.0, normalizedSpeed));
      
      // Convert speed (0.5-2.0) to rate integer (-50 to 50 where 0 is normal)
      // Formula: rate = (speed - 1.0) * 50
      // This maps: 0.5→-25, 1.0→0, 2.0→50
      // But to use full range: map 0.5→-50, 1.0→0, 2.0→50
      // Linear mapping: rate = ((speed - 0.5) / 1.5) * 100 - 50
      const rate = ((normalizedSpeed - 0.5) / 1.5) * 100 - 50;
      requestBody.rate = Math.round(Math.max(-50, Math.min(50, rate)));
      
      console.log(`🎤 Murf: Speed conversion: ${options.speed} → ${normalizedSpeed} → rate ${requestBody.rate}`);
    }
    // Pitch is integer in API (not semitones)
    if (options.pitch !== undefined) {
      requestBody.pitch = Math.round(options.pitch); // Convert to integer
    }

    console.log("🎤 Murf: Request config:", JSON.stringify(requestBody, null, 2));
    
    // Try the streaming endpoint first (as user specified)
    const endpoint = `${baseUrl}/speech/stream`;
    console.log("🎤 Murf: API URL:", endpoint);

    // Call Murf.ai streaming API
    let response: Response;
    
    try {
      // Try with api-key header first (most common for Murf.ai)
      console.log("🎤 Murf: Attempting API call with api-key header...");
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }) as Response;
      
      console.log("🎤 Murf: Response status:", response.status);
      
      // If auth failed, try Authorization header
      if (response.status === 401 || response.status === 403) {
        console.log("🔄 Murf: api-key failed (401/403), trying Authorization header...");
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }) as Response;
        console.log("🎤 Murf: Authorization header response status:", response.status);
      }
    } catch (err: any) {
      console.error("❌ Murf: Network/Fetch error:", err);
      return {
        error: `Failed to connect to Murf.ai API: ${err.message}. Please check your internet connection and API endpoint.`,
      };
    }

    console.log("🎤 Murf: Response status:", response.status);
    console.log("🎤 Murf: Response headers:", JSON.stringify(response.headers.raw(), null, 2));

    // Check content type to detect HTML error pages
    const contentType = response.headers.get("content-type") || "";
    console.log("🎤 Murf: Content-Type:", contentType);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Murf API Error Response:", errorText.substring(0, 500));
      
      // Check if it's HTML (error page)
      if (contentType.includes("text/html") || errorText.trim().startsWith("<!DOCTYPE")) {
        return {
          error: `Murf.ai API returned an error page (${response.status}). Please check your API key and endpoint. The API might require a different endpoint or authentication method.`,
        };
      }
      
      let errorMessage = "Failed to generate speech";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText.substring(0, 200) || `HTTP ${response.status}: ${response.statusText}`;
      }

      return {
        error: errorMessage,
      };
    }

    // Check if response is JSON (for API responses) or binary (for audio)
    if (contentType.includes("application/json")) {
      // API returns JSON with audio URL or file
      const jsonData = await response.json();
      console.log("🎤 Murf: JSON Response:", JSON.stringify(jsonData, null, 2));
      
      if (jsonData.audio_file || jsonData.audioUrl) {
        // If API returns a URL, fetch the audio
        const audioUrl = jsonData.audio_file || jsonData.audioUrl;
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const base64Audio = audioBuffer.toString("base64");
        const mimeType = options.format === "wav" ? "audio/wav" : "audio/mpeg";
        const dataUrl = `data:${mimeType};base64,${base64Audio}`;
        
        return {
          audioUrl: dataUrl,
          audioBuffer,
        };
      }
      
      return {
        error: "No audio file URL in API response",
        raw: jsonData,
      };
    } else {
      // Direct audio stream
      let audioBuffer: Buffer;
      try {
        audioBuffer = await response.buffer();
      } catch (err) {
        // Fallback for newer fetch implementations
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      }
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error("❌ Murf: Empty audio response");
        return {
          error: "Received empty audio response from Murf.ai",
        };
      }

      console.log(`✅ Murf: Generated audio (${audioBuffer.length} bytes)`);

      // Convert buffer to base64 data URL for frontend
      const base64Audio = audioBuffer.toString("base64");
      const mimeType = options.format === "wav" ? "audio/wav" : "audio/mpeg";
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;

      return {
        audioUrl,
        audioBuffer,
      };
    }
  } catch (err: any) {
    console.error("❌ Murf Service Error:", err);
    return {
      error: err.message || "Murf.ai service encountered an unexpected error",
    };
  }
}

/**
 * Get available voices from Murf.ai (with caching)
 */
export async function getMurfVoices(): Promise<{ voices: any[]; error?: string }> {
  try {
    // Return cached voices if available
    if (cachedVoices && cachedVoices.length > 0) {
      console.log(`🎤 Using cached voices (${cachedVoices.length} voices)`);
      return { voices: cachedVoices };
    }

    // If already fetching, wait for that promise
    if (voicesFetchPromise) {
      console.log("🎤 Waiting for ongoing voice fetch...");
      const voices = await voicesFetchPromise;
      return { voices };
    }

    // Fetch voices from API
    voicesFetchPromise = (async () => {
      try {
        console.log("🎤 Fetching voices from Murf.ai API...");
        const response = await fetch(`${baseUrl}/speech/voices`, {
          method: "GET",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
          },
        });

        console.log(`🎤 Voices API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Failed to fetch Murf voices:", errorText);
          // Try Authorization header as fallback
          if (response.status === 401 || response.status === 403) {
            console.log("🔄 Trying Authorization header...");
            const authResponse = await fetch(`${baseUrl}/speech/voices`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });
            
            if (authResponse.ok) {
              const authData = await authResponse.json();
              const voices = authData.voices || authData || [];
              cachedVoices = Array.isArray(voices) ? voices : [];
              console.log(`✅ Fetched ${cachedVoices.length} voices using Authorization header`);
              return cachedVoices;
            }
          }
          return [];
        }

        const data = await response.json();
        console.log("🎤 Voices API response:", JSON.stringify(data, null, 2).substring(0, 1000));
        
        // Handle different response formats
        let voices: any[] = [];
        if (Array.isArray(data)) {
          voices = data;
        } else if (data.voices && Array.isArray(data.voices)) {
          voices = data.voices;
        } else if (data.data && Array.isArray(data.data)) {
          voices = data.data;
        } else if (typeof data === 'object') {
          // Try to find any array property
          for (const key in data) {
            if (Array.isArray(data[key])) {
              voices = data[key];
              break;
            }
          }
        }
        
        // Cache the voices
        cachedVoices = voices;
        console.log(`✅ Fetched ${cachedVoices.length} voices from Murf.ai`);
        
        if (cachedVoices.length > 0) {
          console.log("🎤 First voice structure:", JSON.stringify(cachedVoices[0], null, 2));
        } else {
          console.warn("⚠️ No voices found in API response. Full response:", JSON.stringify(data, null, 2));
        }
        
        return cachedVoices;
      } catch (err: any) {
        console.error("❌ Failed to fetch Murf voices:", err);
        console.error("❌ Error stack:", err.stack);
        return [];
      } finally {
        voicesFetchPromise = null;
      }
    })();

    const voices = await voicesFetchPromise;
    return { voices };
  } catch (err: any) {
    console.error("❌ Failed to fetch Murf voices:", err);
    return {
      voices: [],
      error: err.message || "Failed to fetch voices",
    };
  }
}

/**
 * Get a valid default voice ID from the API
 */
async function getDefaultVoiceId(): Promise<string | null> {
  try {
    const result = await getMurfVoices();
    console.log("🎤 getDefaultVoiceId: Fetched voices result:", JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error("❌ Error fetching voices:", result.error);
      return null;
    }
    
    if (result.voices && result.voices.length > 0) {
      // Try to find a voice with an ID field
      for (const voice of result.voices) {
        const voiceId = voice.id || voice.voiceId || voice.voice_id || voice.voiceId;
        if (voiceId && typeof voiceId === 'string' && voiceId.length > 0) {
          console.log(`✅ Using default voice ID: ${voiceId} (from voice: ${JSON.stringify(voice)})`);
          return voiceId;
        }
      }
      
      // Log the structure of voices for debugging
      console.log("⚠️ Voices fetched but no valid ID found. Voice structure:", JSON.stringify(result.voices[0], null, 2));
    } else {
      console.warn("⚠️ No voices returned from API");
    }
    return null;
  } catch (err) {
    console.error("❌ Failed to get default voice ID:", err);
    return null;
  }
}

