import { build as esbuild } from "esbuild";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";

// Build the API function for Vercel
async function buildApi() {
  console.log("Building API function for Vercel...");
  
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  
  // External dependencies that should not be bundled
  // These are either native modules, have optional dependencies, or are better left external
  // Express and common Node.js modules should be external to avoid ESM/require() conflicts
  const alwaysExternal = [
    "@types/*",
    "bufferutil",
    "utf-8-validate",
    "firebase-admin", // Has optional dependencies like @opentelemetry/api
    "pg", // Native PostgreSQL driver
    "ws", // WebSocket native module
    "@google-cloud/*", // Google Cloud packages with optional deps
    "@opentelemetry/*", // Optional telemetry dependencies
    "express", // Externalize to avoid require() issues in ESM
    "multer", // File upload middleware - uses require()
    "openai", // OpenAI SDK - may use require()
    "drizzle-orm", // ORM - may use require()
    "drizzle-kit", // Drizzle CLI tools
    "bytez.js", // Externalize to ensure dependencies like undici are available
    "undici", // Required by bytez.js - must be available at runtime
    "http", // Node.js built-in
    "https", // Node.js built-in
    "path", // Node.js built-in
    "fs", // Node.js built-in
    "url", // Node.js built-in
    "util", // Node.js built-in
    "stream", // Node.js built-in
    "crypto", // Node.js built-in
    "os", // Node.js built-in
    "events", // Node.js built-in
    "net", // Node.js built-in
    "tls", // Node.js built-in
    "zlib", // Node.js built-in
    "querystring", // Node.js built-in
    "child_process", // Node.js built-in
    "cluster", // Node.js built-in
  ];
  
  const externals = allDeps.filter((dep) => {
    // Check if it matches any always external pattern
    return alwaysExternal.some(pattern => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*"));
        return regex.test(dep);
      }
      return dep === pattern;
    });
  });

  // Use a plugin to externalize all node_modules (but not local path aliases)
  const externalizeNodeModulesPlugin = {
    name: "externalize-node-modules",
    setup(build: any) {
      // Don't externalize local path aliases
      const localPathAliases = ["@shared", "@/"];
      
      build.onResolve({ filter: /.*/ }, (args: any) => {
        // Skip if it's a local path alias
        if (localPathAliases.some(alias => args.path.startsWith(alias))) {
          return; // Let esbuild handle it normally (will be bundled)
        }
        
        // Skip if it's a relative path (./ or ../)
        if (args.path.startsWith("./") || args.path.startsWith("../")) {
          return; // Let esbuild handle it normally (will be bundled)
        }
        
        // Check if it's already in our explicit external list
        const isExplicitlyExternal = externals.some((ext) => {
          if (ext.includes("*")) {
            const regex = new RegExp("^" + ext.replace(/\*/g, ".*"));
            return regex.test(args.path);
          }
          return args.path === ext || args.path.startsWith(ext + "/");
        });
        
        // Externalize all node_modules packages (not local paths)
        if (!isExplicitlyExternal && !args.path.includes("/") && !args.path.startsWith(".")) {
          // This looks like a node_modules package
          return { path: args.path, external: true };
        }
      });
    },
  };
  
  await esbuild({
    entryPoints: ["api/index.source.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "api/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: false, // Keep readable for debugging
    external: externals,
    plugins: [externalizeNodeModulesPlugin],
    logLevel: "info",
    banner: {
      js: "// @ts-nocheck\n",
    },
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@shared": "./shared",
      "@": "./client/src",
    },
  }).catch((err) => {
    console.error("esbuild error:", err);
    throw err;
  });
  
  // No need to delete source file - it's named differently so no conflict
  
  console.log("✅ API function built successfully");
}

buildApi().catch((err) => {
  console.error("❌ Failed to build API function:", err);
  process.exit(1);
});

