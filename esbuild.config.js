/**
 * Browser bundle config - scalable for multiple contracts.
 * Add new entries to BROWSER_BUNDLES to build additional bundles.
 */
import esbuild from "esbuild";

const BROWSER_BUNDLES = [
  {
    name: "MafiaInventory",
    entry: "src/browser/mafia-inventory.ts",
    outfile: "dist/mafia-inventory.js",
  },
  {
    name: "MafiaProfile",
    entry: "src/browser/mafia-profile.ts",
    outfile: "dist/mafia-profile.js",
  },
  {
    entry: "src/browser/index.ts",
    outfile: "dist/mafia-utils.js",
    globalName: undefined,
  },
];

const sharedOptions = {
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: true,
};

async function build() {
  const results = await Promise.all(
    BROWSER_BUNDLES.map((bundle) =>
      esbuild.build({
        ...sharedOptions,
        entryPoints: [bundle.entry],
        outfile: bundle.outfile,
        globalName: bundle.globalName ?? bundle.name,
      }),
    ),
  );
  return results;
}

build().then((results) => {
  const failed = results.filter((r) => r.errors.length > 0);
  if (failed.length > 0) {
    console.error("Build failed:", failed);
    process.exit(1);
  }
  console.log("Built:", BROWSER_BUNDLES.map((b) => b.outfile).join(", "));
});
