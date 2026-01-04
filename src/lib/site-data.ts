import fs from 'node:fs/promises';
import path from 'node:path';
import { siteSchema, forbidWords, type SiteData } from './site-schema';

let cache: { data: SiteData; ts: number } | null = null;

async function readJsonFromFile(filePath: string) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const content = await fs.readFile(abs, 'utf-8');
  return JSON.parse(content);
}

async function readJsonFromHttp(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch customer JSON: ${res.status}`);
  return await res.json();
}

export async function readCustomerConfig(): Promise<any> {
  const src = import.meta.env.CUSTOMER_CONFIG_PATH;
  if (!src) return {};
  try {
    if (/^https?:\/\//i.test(src)) {
      return await readJsonFromHttp(src);
    }
    return await readJsonFromFile(src);
  } catch (e) {
    console.warn('[site-data] Failed to load customer JSON:', e);
    return {};
  }
}

function deepMerge<T extends Record<string, any>>(base: T, override: Record<string, any>): T {
  const out: Record<string, any> = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof (out as any)[k] === 'object' &&
      (out as any)[k] !== null &&
      !Array.isArray((out as any)[k])
    ) {
      (out as any)[k] = deepMerge((out as any)[k], v);
    } else {
      (out as any)[k] = v;
    }
  }
  return out as T;
}

export function mergeWithDefaults(def: SiteData, customer: any): SiteData {
  const merged = deepMerge(def as any, customer || {});
  // Simple forbidden word sanitization (best-effort)
  try {
    merged.service.features = (merged.service.features || []).map((f: any) => ({
      ...f,
      title: forbidWords(f.title) ? '（表現調整済み）' : f.title,
      description: forbidWords(f.description) ? '（表現調整済み）' : f.description,
    }));
  } catch {}
  return merged;
}

export async function getSiteData(): Promise<SiteData> {
  const ttl = Number(import.meta.env.SITE_CONFIG_RELOAD_TTL_SECONDS ?? -1);
  const now = Date.now();
  if (cache && ttl >= 0 && now - cache.ts < ttl * 1000) return cache.data;

  // Load defaults
  const defMod = await import('../content/site.default.json');
  const def = defMod.default as SiteData;
  const customer = await readCustomerConfig();
  const merged = mergeWithDefaults(def, customer);
  const parsed = siteSchema().parse(merged);
  cache = { data: parsed, ts: now };
  return parsed;
}

