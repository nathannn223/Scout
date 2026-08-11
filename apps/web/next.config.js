require("dotenv").config({ path: "../../.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@scout/shared"],
  // middleware.ts runs in the Edge Runtime, which does NOT inherit
  // process.env from the dotenv() call above (that only populates the
  // Node.js process running next.config.js / route handlers / Server
  // Components). Re-expose CLERK_SECRET_KEY so it's actually available
  // there too — root .env stays the single source of truth, this just
  // forwards it. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY doesn't need this:
  // Next.js auto-inlines any NEXT_PUBLIC_-prefixed var for every runtime
  // as long as it's in process.env when this config file evaluates.
  env: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  },
};

module.exports = nextConfig;
