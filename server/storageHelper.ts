/**
 * Helper functions for temporary file storage
 * Used for ApyHub summarization which requires public URLs
 */

/**
 * Create a temporary public URL for text content
 * For now, we'll use a simple approach - in production, upload to object storage
 * 
 * TODO: Replace with actual object storage (Vultr, AWS S3, etc.) that returns public URLs
 */
export async function uploadTextToTemporaryStorage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // For development: create a data URL that can be accessed
  // Note: ApyHub needs to fetch the URL, so data URLs won't work
  // In production, upload to object storage and return public URL
  
  // For now, we'll need to implement actual storage
  // This is a placeholder - you'll need to integrate with your storage provider
  throw new Error(
    "Temporary storage not implemented. Please configure object storage (Vultr, AWS S3, etc.) " +
    "or use a file hosting service that provides public URLs for ApyHub summarization."
  );
}

/**
 * Simple in-memory storage for development/testing
 * Creates a temporary endpoint that serves the file
 * 
 * NOTE: This is a development-only solution. For production, use proper object storage.
 */
let temporaryFiles: Map<string, { buffer: Buffer; mimeType: string }> = new Map();
let fileServerPort: number | null = null;

export function getTemporaryFileUrl(filename: string, baseUrl: string = "http://localhost:5678"): string {
  // Store file in memory
  const fileId = filename.replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now();
  return `${baseUrl}/api/temp-files/${fileId}`;
}

export function storeTemporaryFile(fileId: string, buffer: Buffer, mimeType: string = "text/plain"): void {
  temporaryFiles.set(fileId, { buffer, mimeType });
}

export function getTemporaryFile(fileId: string): { buffer: Buffer; mimeType: string } | undefined {
  return temporaryFiles.get(fileId);
}

export function deleteTemporaryFile(fileId: string): void {
  temporaryFiles.delete(fileId);
}

/**
 * Upload text buffer and return a public URL
 * Uses temporary in-memory storage for development
 */
export async function uploadTextForApyHub(
  buffer: Buffer,
  filename: string,
  baseUrl: string = "http://localhost:5678"
): Promise<string> {
  const fileId = `apyhub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  storeTemporaryFile(fileId, buffer, "text/plain");
  
  // Return the URL that ApyHub can fetch
  // Note: This only works if the server is accessible from the internet
  // For localhost, you'll need ngrok or similar, or use actual cloud storage
  const url = `${baseUrl}/api/temp-files/${fileId}`;
  
  console.log("📁 Temporary file stored:", fileId);
  console.log("📁 Temporary file URL:", url);
  
  return url;
}

