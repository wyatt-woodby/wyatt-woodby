# Media Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the non-technical site owner a repo-backed editing UI to add Vimeo videos + still images and drag them into order, with no runtime backend.

**Architecture:** Keystatic embedded at `/keystatic` with GitHub storage edits content-as-data in the repo; a `media` collection holds items and a `feed` singleton holds the drag-sortable order. At build, a server-only reader loads the ordered feed and auto-detects each Vimeo clip's aspect ratio from Vimeo oEmbed. The homepage becomes a server component that loads this data and passes it to a client `Feed` component (the existing DialKit layout).

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Keystatic (`@keystatic/core`, `@keystatic/next`), Vitest + Testing Library, DialKit (existing).

**Spec:** `docs/superpowers/specs/2026-08-16-media-cockpit-design.md`

## Global Constraints

- Next.js **16.3.1** — synchronous `params`/`searchParams` are removed; never access them synchronously.
- Package manager: **npm** (a `package-lock.json` is committed).
- No runtime backend or database. Content lives in the repo under `content/`; images under `public/media/`.
- The editor never types an aspect ratio, a layout choice, or a hierarchy decision. She supplies a link or an image only.
- Vimeo videos are unlisted: the privacy **hash** (e.g. `h=0f7a0c0508`) must be preserved through parsing, embedding, and oEmbed lookup.
- oEmbed or image failures must **degrade to a placeholder**, never crash the build or page.

## File Structure

- `lib/vimeo.ts` — pure parsing of a pasted Vimeo value → `{ id, hash? }`; embed-URL builder. No I/O.
- `lib/media-data.ts` — server-only. Reads the `feed` singleton + `media` collection via Keystatic reader; resolves Vimeo ratios via oEmbed; returns an ordered `ResolvedMediaItem[]`. Owns the `ResolvedMediaItem` type.
- `keystatic.config.ts` — Keystatic config: `media` collection + `feed` singleton, GitHub storage (local mode in dev).
- `app/keystatic/keystatic.tsx`, `app/keystatic/[[...params]]/page.tsx`, `app/keystatic/layout.tsx`, `app/api/keystatic/[...params]/route.ts` — embedded admin UI + route handler.
- `app/MediaBlock.tsx` — gains a `vimeo` branch; switches on `ResolvedMediaItem`.
- `app/Feed.tsx` — new client component holding the DialKit sliders + layout + media map (extracted from today's `page.tsx`).
- `app/page.tsx` — becomes a server component that calls `getMedia()` and renders `<Feed>`.
- `content/media/*.json`, `content/feed.json` — seeded content (migration).
- `app/media.ts` — **deleted** at the end of migration.
- Test tooling: `vitest.config.ts`, `test/setup.ts`, `test/fixtures/**`.

---

## Task 1: Test tooling + Vimeo parsing

**Files:**
- Create: `vitest.config.ts`, `test/setup.ts`
- Create: `lib/vimeo.ts`
- Test: `lib/vimeo.test.ts`
- Modify: `package.json` (devDeps + `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseVimeo(input: string): { id: string; hash?: string } | null`
  - `buildEmbedSrc(v: { id: string; hash?: string }): string`

- [ ] **Step 1: Install test tooling**

```bash
npm install -D vitest@^3 jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

- [ ] **Step 2: Add config + setup + test script**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
```

Create `test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

In `package.json`, add to `"scripts"`: `"test": "vitest run"`.

- [ ] **Step 3: Write the failing test**

Create `lib/vimeo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseVimeo, buildEmbedSrc } from "./vimeo";

const IFRAME =
  '<div style="padding:75% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1218700554?h=0f7a0c0508&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" title="opportunity_for_two"></iframe></div>';

describe("parseVimeo", () => {
  it("parses a full pasted iframe embed (id + hash)", () => {
    expect(parseVimeo(IFRAME)).toEqual({ id: "1218700554", hash: "0f7a0c0508" });
  });
  it("parses a player URL", () => {
    expect(parseVimeo("https://player.vimeo.com/video/1218700554?h=0f7a0c0508")).toEqual({
      id: "1218700554",
      hash: "0f7a0c0508",
    });
  });
  it("parses a share URL with hash path", () => {
    expect(parseVimeo("https://vimeo.com/1218700554/0f7a0c0508")).toEqual({
      id: "1218700554",
      hash: "0f7a0c0508",
    });
  });
  it("parses a bare id with no hash", () => {
    expect(parseVimeo("1218700554")).toEqual({ id: "1218700554" });
  });
  it("returns null for junk", () => {
    expect(parseVimeo("not a vimeo link")).toBeNull();
    expect(parseVimeo("")).toBeNull();
  });
});

describe("buildEmbedSrc", () => {
  it("includes hash and player params", () => {
    expect(buildEmbedSrc({ id: "1218700554", hash: "0f7a0c0508" })).toBe(
      "https://player.vimeo.com/video/1218700554?h=0f7a0c0508&badge=0&autopause=0",
    );
  });
  it("omits h when no hash", () => {
    expect(buildEmbedSrc({ id: "1218700554" })).toBe(
      "https://player.vimeo.com/video/1218700554?badge=0&autopause=0",
    );
  });
});
```

- [ ] **Step 4: Run the test, verify it fails**

Run: `npm test -- lib/vimeo.test.ts`
Expected: FAIL — cannot resolve `./vimeo`.

- [ ] **Step 5: Implement `lib/vimeo.ts`**

```ts
export type VimeoRef = { id: string; hash?: string };

// Accepts a full pasted <iframe> embed, a player.vimeo.com URL, a
// vimeo.com/ID/HASH share URL, or a bare numeric id. Returns null if no id.
export function parseVimeo(input: string): VimeoRef | null {
  if (!input) return null;
  const text = input.trim();

  // player.vimeo.com/video/ID  (optionally ?h=HASH), incl. inside an iframe paste
  const player = text.match(/player\.vimeo\.com\/video\/(\d+)(?:[^"'\s]*[?&]h=([0-9a-f]+))?/i);
  if (player) return player[2] ? { id: player[1], hash: player[2] } : { id: player[1] };

  // vimeo.com/ID/HASH  or  vimeo.com/ID
  const share = text.match(/vimeo\.com\/(\d+)(?:\/([0-9a-f]+))?/i);
  if (share) return share[2] ? { id: share[1], hash: share[2] } : { id: share[1] };

  // bare numeric id
  const bare = text.match(/^(\d+)$/);
  if (bare) return { id: bare[1] };

  return null;
}

export function buildEmbedSrc({ id, hash }: VimeoRef): string {
  const params = [hash ? `h=${hash}` : "", "badge=0", "autopause=0"].filter(Boolean);
  return `https://player.vimeo.com/video/${id}?${params.join("&")}`;
}
```

- [ ] **Step 6: Run the test, verify it passes**

Run: `npm test -- lib/vimeo.test.ts`
Expected: PASS (all cases).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts test/setup.ts lib/vimeo.ts lib/vimeo.test.ts
git commit -m "feat: vimeo paste parsing + test tooling"
```

---

## Task 2: Keystatic config + embedded admin

**Files:**
- Create: `keystatic.config.ts`
- Create: `app/keystatic/keystatic.tsx`, `app/keystatic/[[...params]]/page.tsx`, `app/keystatic/layout.tsx`
- Create: `app/api/keystatic/[...params]/route.ts`
- Modify: `package.json` (deps)

**Interfaces:**
- Consumes: nothing at runtime; Task 3 imports the default export of `keystatic.config.ts`.
- Produces:
  - Default export `config` from `keystatic.config.ts` with a `media` collection (slug field `title`; conditional field `media` discriminated by `type` ∈ `vimeo|image|video`) and a `feed` singleton (`items: array(relationship → media)`).
  - Working admin at `/keystatic`, route handler at `/api/keystatic/[...]`.

- [ ] **Step 1: Install Keystatic**

```bash
npm install @keystatic/core @keystatic/next
```

- [ ] **Step 2: Write `keystatic.config.ts`**

```ts
import { config, collection, singleton, fields } from "@keystatic/core";

const storage =
  process.env.NODE_ENV === "production" && process.env.KEYSTATIC_REPO
    ? ({ kind: "github", repo: process.env.KEYSTATIC_REPO } as const)
    : ({ kind: "local" } as const);

export default config({
  storage,
  collections: {
    media: collection({
      label: "Media",
      slugField: "title",
      path: "content/media/*",
      format: { data: "json" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        media: fields.conditional(
          fields.select({
            label: "Type",
            options: [
              { label: "Vimeo video", value: "vimeo" },
              { label: "Image", value: "image" },
              { label: "Legacy MP4", value: "video" },
            ],
            defaultValue: "vimeo",
          }),
          {
            vimeo: fields.object({
              vimeoUrl: fields.text({
                label: "Vimeo link",
                description: "Paste the Vimeo share link or embed code.",
                multiline: true,
              }),
            }),
            image: fields.object({
              file: fields.image({
                label: "Image",
                directory: "public/media",
                publicPath: "/media/",
              }),
            }),
            video: fields.object({
              videoSrc: fields.text({ label: "MP4 path (legacy)" }),
              poster: fields.text({ label: "Poster path (legacy)" }),
            }),
          },
        ),
      },
    }),
  },
  singletons: {
    feed: singleton({
      label: "Feed order",
      path: "content/feed",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.relationship({ label: "Item", collection: "media" }),
          { label: "Items", itemLabel: (p) => p.value ?? "Select item" },
        ),
      },
    }),
  },
});
```

- [ ] **Step 3: Write the admin route files**

`app/keystatic/keystatic.tsx`:

```tsx
"use client";
import { makePage } from "@keystatic/next/ui/app";
import config from "../../keystatic.config";

export default makePage(config);
```

`app/keystatic/[[...params]]/page.tsx`:

```tsx
import KeystaticApp from "../keystatic";
export default KeystaticApp;
```

`app/keystatic/layout.tsx`:

```tsx
export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

`app/api/keystatic/[...params]/route.ts`:

```ts
import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../keystatic.config";

export const { POST, GET } = makeRouteHandler({ config });
```

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Then:
1. Open `http://localhost:<port>/keystatic` → the admin UI loads (200, no console errors).
2. Create a **Media** item: Title "Smoke Test", Type "Vimeo video", paste `https://vimeo.com/1218700554/0f7a0c0508`. Save → confirm `content/media/smoke-test.json` is written.
3. Open **Feed order** → add the item to the list, drag to reorder → Save → confirm `content/feed.json` lists the slug.

Then delete the smoke files so they don't pollute the seed:

```bash
rm -f content/media/smoke-test.json && git checkout -- content/feed.json 2>/dev/null; true
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json keystatic.config.ts app/keystatic app/api/keystatic
git commit -m "feat: embed Keystatic admin with media collection + feed order"
```

---

## Task 3: Server data loader (reader + oEmbed ratios)

**Files:**
- Create: `lib/media-data.ts`
- Test: `lib/media-data.test.ts`
- Create: `test/fixtures/content/feed.json`, `test/fixtures/content/media/*.json`

**Interfaces:**
- Consumes: `parseVimeo`, `buildEmbedSrc` from `lib/vimeo.ts`; default `config` from `keystatic.config.ts`.
- Produces:
  - Type `ResolvedMediaItem` (discriminated on `kind`):
    - `{ kind: "vimeo"; id: string; title: string; embedSrc: string; width: number; height: number }`
    - `{ kind: "image"; id: string; title: string; src: string }`
    - `{ kind: "video"; id: string; title: string; src: string; poster?: string }`
    - `{ kind: "missing"; id: string; title: string }`
  - `getMedia(root?: string): Promise<ResolvedMediaItem[]>` — ordered per the feed singleton.

- [ ] **Step 1: Create the test fixture**

`test/fixtures/content/media/clip.json`:

```json
{ "title": "Clip", "media": { "discriminant": "vimeo", "value": { "vimeoUrl": "https://vimeo.com/1218700554/0f7a0c0508" } } }
```

`test/fixtures/content/media/still.json`:

```json
{ "title": "Still", "media": { "discriminant": "image", "value": { "file": "/media/still.jpg" } } }
```

`test/fixtures/content/media/broken.json`:

```json
{ "title": "Broken", "media": { "discriminant": "vimeo", "value": { "vimeoUrl": "" } } }
```

`test/fixtures/content/feed.json`:

```json
{ "items": ["still", "clip", "broken"] }
```

- [ ] **Step 2: Write the failing test**

Create `lib/media-data.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMedia } from "./media-data";

const ROOT = new URL("../test/fixtures", import.meta.url).pathname;

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ width: 1080, height: 1350 }), { status: 200 }),
    ),
  );
});

describe("getMedia", () => {
  it("returns items in feed order", async () => {
    const items = await getMedia(ROOT);
    expect(items.map((i) => i.id)).toEqual(["still", "clip", "broken"]);
  });

  it("resolves an image to its public path", async () => {
    const still = (await getMedia(ROOT))[0];
    expect(still).toMatchObject({ kind: "image", src: "/media/still.jpg" });
  });

  it("resolves a vimeo clip with oEmbed dimensions", async () => {
    const clip = (await getMedia(ROOT))[1];
    expect(clip).toMatchObject({ kind: "vimeo", width: 1080, height: 1350 });
    if (clip.kind === "vimeo") expect(clip.embedSrc).toContain("player.vimeo.com/video/1218700554");
  });

  it("marks an unparseable vimeo item as missing", async () => {
    const broken = (await getMedia(ROOT))[2];
    expect(broken).toMatchObject({ kind: "missing", id: "broken" });
  });

  it("falls back to 16:9 when oEmbed fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const clip = (await getMedia(ROOT))[1];
    expect(clip).toMatchObject({ kind: "vimeo", width: 16, height: 9 });
  });
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npm test -- lib/media-data.test.ts`
Expected: FAIL — cannot resolve `./media-data`.

- [ ] **Step 4: Implement `lib/media-data.ts`**

```ts
import "server-only";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import { parseVimeo, buildEmbedSrc } from "./vimeo";

export type ResolvedMediaItem =
  | { kind: "vimeo"; id: string; title: string; embedSrc: string; width: number; height: number }
  | { kind: "image"; id: string; title: string; src: string }
  | { kind: "video"; id: string; title: string; src: string; poster?: string }
  | { kind: "missing"; id: string; title: string };

const dimsCache = new Map<string, { width: number; height: number }>();

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
    return { kind: "vimeo", id, title, embedSrc: buildEmbedSrc(ref), width, height };
  }
  if (discriminant === "image") {
    const src = (value as { file?: string }).file;
    if (!src) return { kind: "missing", id, title };
    return { kind: "image", id, title, src };
  }
  if (discriminant === "video") {
    const v = value as { videoSrc?: string; poster?: string };
    if (!v.videoSrc) return { kind: "missing", id, title };
    return { kind: "video", id, title, src: v.videoSrc, poster: v.poster || undefined };
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
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npm test -- lib/media-data.test.ts`
Expected: PASS. If the reader returns image paths without a leading `/`, adjust the image assertion/implementation to prefix `publicPath` — verify the reader's actual return shape here and keep the test green.

- [ ] **Step 6: Commit**

```bash
git add lib/media-data.ts lib/media-data.test.ts test/fixtures
git commit -m "feat: server media loader with vimeo oembed ratio detection"
```

---

## Task 4: MediaBlock vimeo branch

**Files:**
- Modify: `app/MediaBlock.tsx`
- Test: `app/MediaBlock.test.tsx`

**Interfaces:**
- Consumes: `ResolvedMediaItem` from `lib/media-data.ts`.
- Produces: `MediaBlock({ item }: { item: ResolvedMediaItem })` rendering a branch per `kind`.

- [ ] **Step 1: Write the failing test**

Create `app/MediaBlock.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaBlock } from "./MediaBlock";

describe("MediaBlock vimeo branch", () => {
  it("renders a styled iframe with the correct aspect ratio", () => {
    render(
      <MediaBlock
        item={{ kind: "vimeo", id: "clip", title: "Clip", embedSrc: "https://player.vimeo.com/video/1218700554?h=0f7a0c0508&badge=0&autopause=0", width: 1080, height: 1350 }}
      />,
    );
    const frame = screen.getByTitle("Clip") as HTMLIFrameElement;
    expect(frame.getAttribute("src")).toContain("player.vimeo.com/video/1218700554");
    const wrapper = frame.closest(".block--vimeo") as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe("1080 / 1350");
  });

  it("renders a placeholder for a missing item", () => {
    render(<MediaBlock item={{ kind: "missing", id: "x", title: "Gone" }} />);
    expect(screen.getByText("Gone")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test -- app/MediaBlock.test.tsx`
Expected: FAIL — `MediaBlock` still expects the old `MediaItem` type / has no vimeo branch.

- [ ] **Step 3: Rewrite `app/MediaBlock.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import type { ResolvedMediaItem } from "../lib/media-data";

export function MediaBlock({ item }: { item: ResolvedMediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  if (item.kind === "missing") {
    return (
      <div className="block placeholder" aria-label={item.title}>
        <span className="placeholder__label">{item.title}</span>
        <span className="placeholder__hint">add media</span>
      </div>
    );
  }

  if (item.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="block" src={item.src} alt={item.title} />;
  }

  if (item.kind === "vimeo") {
    return (
      <div className="block block--vimeo" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
        <iframe
          src={item.embedSrc}
          title={item.title}
          frameBorder={0}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  // kind === "video" (legacy MP4)
  const play = () => {
    setPlaying(true);
    videoRef.current?.play();
  };
  return (
    <div className="block block--video">
      <video
        ref={videoRef}
        src={item.src}
        poster={item.poster}
        preload="metadata"
        controls={playing}
        playsInline
        onPause={() => {
          if (videoRef.current && videoRef.current.currentTime === 0) setPlaying(false);
        }}
      />
      {!playing && (
        <button className="playbtn" onClick={play} aria-label={`Play ${item.title}`}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add `.block--vimeo` positioning to `app/globals.css`**

The iframe is absolutely positioned, so its wrapper must establish a positioning context. Append to `app/globals.css`:

```css
.block--vimeo {
  position: relative;
  width: 100%;
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npm test -- app/MediaBlock.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/MediaBlock.tsx app/MediaBlock.test.tsx app/globals.css
git commit -m "feat: render vimeo embeds in MediaBlock with detected aspect ratio"
```

---

## Task 5: Seed content from `media.ts`

**Files:**
- Create: `content/media/*.json` (one per current item), `content/feed.json`
- Reference: `app/media.ts` (source of the 12 items; not modified here)

**Interfaces:**
- Consumes: the current `media` array in `app/media.ts`.
- Produces: `content/` matching the `keystatic.config.ts` schema and readable by `getMedia()`.

- [ ] **Step 1: Write one JSON file per item in `app/media.ts`**

For each entry, create `content/media/<id>.json`. Map by the entry's `type`:

Image entry (e.g. `photo_two_render`):

```json
{ "title": "Photo Two", "media": { "discriminant": "image", "value": { "file": "/media/photo_two_render.jpg" } } }
```

Legacy MP4 entry (e.g. `apartment`):

```json
{ "title": "Apartment", "media": { "discriminant": "video", "value": { "videoSrc": "/media/apartment.mp4", "poster": "/media/posters/apartment.jpg" } } }
```

If a real Vimeo link is already known for an item, use the vimeo shape instead:

```json
{ "title": "Opportunity for Two", "media": { "discriminant": "vimeo", "value": { "vimeoUrl": "https://vimeo.com/1218700554/0f7a0c0508" } } }
```

The slug (filename) should match the existing `id` so posters/paths stay recognizable. Use the existing `alt` text as `title`.

- [ ] **Step 2: Write `content/feed.json` in the current order**

List every slug in the exact order they appear in `app/media.ts`:

```json
{ "items": ["opportunity_for_two", "photo_two_render", "roomba_edit", "photo_1_render_crop", "apartment", "BLOOMING_16x9_30s", "WIND_16x9_30s", "TRIO_16x9_30s", "06_HIDING_16x9", "chaos_edit", "gagosian_render", "biere_three"] }
```

- [ ] **Step 3: Verify the loader reads the seed**

Add a temporary check (run, then delete the file):

```bash
cat > /tmp/check-media.mjs <<'EOF'
import { getMedia } from "./lib/media-data.ts";
const items = await getMedia();
console.log(items.length, items.map((i) => `${i.id}:${i.kind}`).join("\n"));
EOF
npx tsx /tmp/check-media.mjs
```

Expected: 12 items, in feed order, each `image` or `video` (or `vimeo` where a link was supplied), none `missing`. Then `rm /tmp/check-media.mjs`.

- [ ] **Step 4: Commit**

```bash
git add content
git commit -m "chore: seed media collection + feed order from media.ts"
```

---

## Task 6: Split page into server loader + client Feed; delete `media.ts`

**Files:**
- Create: `app/Feed.tsx`
- Modify: `app/page.tsx`
- Delete: `app/media.ts`

**Interfaces:**
- Consumes: `getMedia()` + `ResolvedMediaItem` from `lib/media-data.ts`; `MediaBlock` from `./MediaBlock`.
- Produces: `Feed({ items }: { items: ResolvedMediaItem[] })` (client) and a server `page.tsx`.

- [ ] **Step 1: Create `app/Feed.tsx` (client) with today's layout**

Move the DialKit sliders, side-padding math, theme effect, header/footer chrome, and the media map out of `page.tsx` into this client component. It takes resolved items as a prop instead of importing `media`.

```tsx
"use client";

import { useEffect } from "react";
import { useDialKit } from "dialkit";
import type { ResolvedMediaItem } from "../lib/media-data";
import { MediaBlock } from "./MediaBlock";

export function Feed({ items }: { items: ResolvedMediaItem[] }) {
  const {
    blackBackground,
    logoMinWidth,
    logoMaxWidth,
    sidePadding,
    logoBottomPadding,
    contactTopPadding,
    mediaGap,
  } = useDialKit("Layout", {
    blackBackground: true,
    logoMinWidth: [240, 40, 600, 2],
    logoMaxWidth: [300, 120, 1200, 2],
    sidePadding: [276, 0, 400, 4],
    contactTopPadding: [24, 0, 120, 4],
    logoBottomPadding: [32, 0, 120, 4],
    mediaGap: [48, 0, 160, 4],
  });

  const SIDE_ZERO = 500;
  const SIDE_REACH = 1440;
  const sideSlope = (sidePadding / (SIDE_REACH - SIDE_ZERO)).toFixed(5);
  const sidePad = `clamp(0px, calc((100vw - ${SIDE_ZERO}px) * ${sideSlope}), ${sidePadding}px)`;

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", blackBackground);
  }, [blackBackground]);

  return (
    <>
      <header className="contact" style={{ top: contactTopPadding }}>
        <a href="mailto:contact@wyattwoodby.com">Contact</a>
      </header>

      <main className="feed" style={{ gap: mediaGap, paddingLeft: sidePad, paddingRight: sidePad }}>
        {items.map((item) => (
          <MediaBlock key={item.id} item={item} />
        ))}
      </main>

      <footer className="logo" style={{ bottom: logoBottomPadding }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/logo.svg"
          alt="Wyatt Woodby"
          style={{ width: `clamp(${logoMinWidth}px, 56vw - 190px, ${logoMaxWidth}px)` }}
        />
      </footer>
    </>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx` with a server component**

```tsx
import { getMedia } from "../lib/media-data";
import { Feed } from "./Feed";

export default async function Home() {
  const items = await getMedia();
  return <Feed items={items} />;
}
```

- [ ] **Step 3: Delete the obsolete `media.ts`**

```bash
git rm app/media.ts
```

- [ ] **Step 4: Full test + build check**

Run: `npm test`
Expected: all suites pass.

Run: `npm run build`
Expected: build succeeds; no type error about a missing `./media` import or synchronous `params`.

- [ ] **Step 5: Manual smoke**

Run: `npm run dev`, open the homepage. Confirm the seeded feed renders in order — images and legacy MP4s exactly as before. If a Vimeo item was seeded, confirm it renders flush at its true ratio (no black bars). Open `/keystatic`, drag two items to swap order, Save, refresh the homepage → order changed.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/Feed.tsx
git commit -m "feat: load feed from CMS via server component; remove media.ts"
```

---

## Post-implementation (not code)

- Set `KEYSTATIC_REPO=<owner>/<repo>` in Vercel env and complete the Keystatic GitHub connection so production writes commit to the repo.
- Invite the owner to the repo; confirm she can log into `/keystatic` and that Save commits + Vercel redeploys.
- Write her a short "Add a video / photo / reorder" note (screenshots): create a Media item → paste the Vimeo link → open **Feed order** → drag into place → Save.

## Self-Review notes

- **Spec coverage:** CMS embed (T2), GitHub storage (T2 config + post-impl env), single ordered feed (T2 singleton + T5/T6), Vimeo parse incl. hash (T1), auto ratio via oEmbed with 16:9 fallback (T3), own styled iframe not paste-blob (T4), image-in-repo (T2 image field + T5), page split server/client (T6), migration keeping MP4s live then deleting media.ts (T5/T6), placeholder degradation (T3/T4). Onboarding is post-impl (non-code, per spec).
- **Open item from spec** (oEmbed reliability for unlisted videos): validated live in T2 smoke + T3; the ratio-select fallback is not built unless smoke shows oEmbed failing — noted so the executor doesn't add it speculatively (YAGNI).
- **Types:** `ResolvedMediaItem` defined in T3, consumed unchanged in T4 and T6; `parseVimeo`/`buildEmbedSrc` signatures consistent across T1/T3.
