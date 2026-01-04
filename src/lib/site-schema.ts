import { z } from 'zod';

// Simple forbidden terms check (JP clinic-like words)
export function forbidWords(text: string): boolean {
  const banned = ['治療', '改善', '効果', '医療'];
  return banned.some((w) => text.includes(w));
}

export function siteSchema() {
  const feature = z.object({
    icon: z.string().default('lucide:check-circle'),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(300),
  });

  return z.object({
    brand: z.object({
      name: z.string().min(1),
      tagline: z.string().default(''),
      area: z.string().default(''),
      phone: z.string().optional(),
      lineUrl: z.string().url().optional(),
      instagramUrl: z.string().url().optional(),
      address: z.string().optional(),
    }),
    service: z.object({
      primaryOffer: z.string().default(''),
      features: z.array(feature).min(1),
      menu: z.array(
        z.object({ name: z.string(), duration: z.number().optional(), price: z.number(), note: z.string().optional() })
      ).default([]),
    }),
    cta: z.object({
      primaryText: z.string().default('お問い合わせはこちら'),
      primaryUrl: z.string().default('/contact'),
    }),
    analytics: z.object({
      gtm_container_id: z.string().nullable().optional(),
    }).default({}),
  });
}

export type SiteData = z.infer<ReturnType<typeof siteSchema>>;

