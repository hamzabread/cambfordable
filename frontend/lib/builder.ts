import { builder } from "@builder.io/sdk";

const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY;

if (!BUILDER_API_KEY) {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Warning: NEXT_PUBLIC_BUILDER_API_KEY is not defined in your environment variables. " +
      "Builder.io will fall back to local React pages."
    );
  }
}

// Initialize the Builder SDK with the API Key or a dummy string to prevent erroring during boot
builder.init(BUILDER_API_KEY || "dummy-key-for-local-fallback");

export { builder };
