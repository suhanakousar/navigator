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
  const externals = allDeps.filter((dep) => {
    // Bundle most things, but keep native modules external
    return dep.startsWith("@types/") || 
           dep === "bufferutil" || 
           dep === "utf-8-validate";
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

