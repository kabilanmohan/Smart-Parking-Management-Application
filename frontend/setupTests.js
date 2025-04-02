import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
globalThis.import = {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: "test-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "test-auth-domain",
        VITE_FIREBASE_PROJECT_ID: "test-project-id"
      }
    }
  };
  