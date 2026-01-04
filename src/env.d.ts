/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly SITE_NAME: string;
  readonly SITE_DESCRIPTION: string;
  readonly SITE_AUTHOR: string;
  readonly PUBLIC_GTM_CONTAINER_ID?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly TURNSTILE_SECRET_KEY?: string;
  readonly RESEND_API_KEY?: string;
  readonly SITE_CONTACT_TO_EMAIL?: string;
  readonly CUSTOMER_CONFIG_PATH?: string;
  readonly SITE_CONFIG_RELOAD_TTL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
