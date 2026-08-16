import "server-only";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import { parseVimeo } from "./vimeo";

export type ResolvedMediaItem =
  | { kind: "vimeo"; id: string; title: string; vimeoId: string; hash?: string; width: number; height: number }
  | { kind: "image"; id: string; title: string; src: string }
  | { kind: "missing"; id: string; title: string };

const dimsCache = new Map<string, { width: number; height: number }>();

// Test-only: clears the per-process oEmbed dimension cache between cases.
export function __resetDimsCache(): void {
  dimsCache.clear();
}

async function fetchDimensions(id: string, hash?: string): Promise<{ width: number; height: number }> {
  const key = `${id}:${hash ?? ""}`;
  const cached = dimsCache.get(key);
  if (cached) return cached;
  const pageUrl = `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
  const fallback = { width: 16, height: 9 };
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`);
    if (!res.ok) return fallback;
    const data = (await res.json()) as { width?: number; height?: number };
    const dims = { width: data.width ?? 16, height: data.height ?? 9 };
    dimsCache.set(key, dims);
    return dims;
  } catch {
    return fallback;
  }
}

// entry.media is Keystatic's conditional field: { discriminant, value }.
async function resolveEntry(
  id: string,
  entry: { title: string; media: { discriminant: string; value: unknown } },
): Promise<ResolvedMediaItem> {
  const title = entry.title;
  const { discriminant, value } = entry.media;

  if (discriminant === "vimeo") {
    const ref = parseVimeo((value as { vimeoUrl?: string }).vimeoUrl ?? "");
    if (!ref) return { kind: "missing", id, title };
    const { width, height } = await fetchDimensions(ref.id, ref.hash);
    return { kind: "vimeo", id, title, vimeoId: ref.id, hash: ref.hash, width, height };
  }
  if (discriminant === "image") {
    const file = (value as { file?: string }).file;
    if (!file) return { kind: "missing", id, title };
    // Keystatic's JSON reader returns the bare stored filename; map it to the
    // configured publicPath so the browser can load it from /media/.
    const src = file.startsWith("/") ? file : `/media/${file}`;
    return { kind: "image", id, title, src };
  }
  return { kind: "missing", id, title };
}

export async function getMedia(root: string = process.cwd()): Promise<ResolvedMediaItem[]> {
  const reader = createReader(root, keystaticConfig);
  const feed = await reader.singletons.feed.read();
  const slugs = ((feed?.items ?? []) as (string | null)[]).filter(Boolean) as string[];
  const out: ResolvedMediaItem[] = [];
  for (const slug of slugs) {
    const entry = await reader.collections.media.read(slug);
    if (!entry) continue;
    out.push(await resolveEntry(slug, entry as never));
  }
  return out;
}
