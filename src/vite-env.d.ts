/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DOCUSIGN_CLIENT_ID: string;
  readonly VITE_DOCUSIGN_ACCOUNT_ID: string;
  readonly VITE_ADOBE_SIGN_CLIENT_ID: string;
  readonly VITE_RIGHTSIGNATURE_API_KEY: string;
  readonly VITE_PANDADOC_API_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_STRIPE_SECRET_KEY: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
