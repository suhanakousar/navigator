import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error: any = new Error(`${res.status}: ${text}`);
    error.status = res.status;
    error.response = res;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = await getAuthToken();
  const headers: HeadersInit = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Allow 503 and other error statuses to be handled by the caller
  // Don't throw here - let the caller decide how to handle errors
  if (!res.ok) {
    // Check if response is HTML (error page)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const error: any = new Error(`Server returned HTML error page (${res.status}). The endpoint may not exist or there's a server error.`);
      error.status = res.status;
      error.isHtml = true;
      throw error;
    }
  }

  // For 503, return the response so caller can handle it
  if (res.status === 503) {
    return res;
  }

  // For other errors, throw
  if (!res.ok) {
    await throwIfResNotOk(res);
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Handle queryKey array - if first element starts with /, use it directly
      const url = Array.isArray(queryKey) && queryKey[0]?.startsWith("/") 
        ? queryKey[0] 
        : queryKey.join("/");

      const res = await fetch(url as string, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Handle non-OK responses gracefully
      if (!res.ok) {
        // For 404, return empty array/object instead of throwing
        if (res.status === 404) {
          return [] as T;
        }
        // For other errors, try to parse JSON error, otherwise return empty
        try {
          const errorData = await res.json();
          console.error("Query error:", errorData);
          return [] as T;
        } catch {
          return [] as T;
        }
      }

      return await res.json();
    } catch (error: any) {
      console.error("Query function error:", error);
      // Return empty array/object instead of throwing to prevent blank pages
      return [] as T;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
