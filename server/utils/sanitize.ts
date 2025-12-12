/**
 * Sanitize text for JSON storage - removes null bytes and control characters
 * that PostgreSQL cannot store in JSON/JSONB columns
 */
export function sanitizeForJSON(str: string | null | undefined): string {
  if (!str) return "";
  
  // Remove NUL and other control chars except newline/tab/carriage return
  return str
    .replace(/\u0000/g, "") // Remove null bytes first
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, (c) => {
      // Keep newlines, carriage returns, and tabs
      if (c === "\n" || c === "\r" || c === "\t") return c;
      return "";
    })
    .trim();
}

/**
 * Recursively clean an object to remove null bytes and control characters
 * from all string values. This ensures the object can be safely stored in PostgreSQL JSONB.
 */
export function cleanObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "string") {
    return sanitizeForJSON(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  
  if (obj && typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObject(value);
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Limit string length to prevent storing excessively large text in database
 */
export function limitTextLength(text: string, maxLength: number = 3000): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Clean and limit extracted data before storing in database
 */
export function prepareDataForStorage(data: any, maxSnippetLength: number = 3000): any {
  if (!data) return data;
  
  const cleaned = cleanObject(data);
  
  // Limit raw_text_snippet size if present
  if (cleaned.raw_text_snippet && typeof cleaned.raw_text_snippet === "string") {
    cleaned.raw_text_snippet = limitTextLength(cleaned.raw_text_snippet, maxSnippetLength);
  }
  
  // Limit ocrText if present
  if (cleaned.ocrText && typeof cleaned.ocrText === "string") {
    cleaned.ocrText = limitTextLength(cleaned.ocrText, maxSnippetLength);
  }
  
  return cleaned;
}

// Export aliases for backward compatibility and clearer naming
export const sanitizeText = sanitizeForJSON;
export const sanitizeExtractedData = cleanObject;

