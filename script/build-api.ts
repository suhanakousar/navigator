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
  const alwaysExternal = [
    "@types/*",
    "bufferutil",
    "utf-8-validate",
    "firebase-admin", // Has optional dependencies like @opentelemetry/api
    "pg", // Native PostgreSQL driver
    "ws", // WebSocket native module
    "@google-cloud/*", // Google Cloud packages with optional deps
    "@opentelemetry/*", // Optional telemetry dependencies
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
    logLevel: "info",
    banner: {
      js: "// @ts-nocheck\n",
    },
    // Ensure local files are bundled
    // By default, esbuild bundles local files (./ and ../) and externalizes node_modules
    // The external list only applies to node_modules packages
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    // Make sure we're not accidentally externalizing local paths
    alias: {},
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

