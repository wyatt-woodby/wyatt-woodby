# Wyatt Woodby Media Cockpit — Design

**Date:** 2026-08-16
**Status:** Approved for planning

## Problem

The portfolio renders a hardcoded `app/media.ts` array (~12 items, single
scrolling column). The owner is non-technical and needs to add media (Vimeo
videos + still images) and reorder them herself, without touching code and
without the developer running any backend. Videos are moving from local MP4s
to Vimeo embeds; stills stay as images committed to the repo (max ~10).

## Constraints & decisions (from brainstorming)

- **Ownership model C:** she is self-sufficient; occasional updates; a rare
  "it's down" is acceptable. → No runtime backend, no database, no host to
  babysit. Content is data in the repo; the editor commits; Vercel rebuilds.
- **Deploy:** Vercel. **Images:** committed into the repo.
- **CMS:** Keystatic, embedded in the existing Next app at `/keystatic`,
  **GitHub storage**. Spike (2026-08-16) confirmed it mounts cleanly on
  Next 16.3.1 / React 19 with no async-`params` breakage.
- **Editor login:** GitHub (she is OK with this).
- **Feed:** single column, videos and stills interleaved, same as today.
- **Aspect ratios:** mixed (16:9, 4:3, 4:5). Must be **automatic** — she never
  types a ratio. Detected from Vimeo oEmbed.
- **No design decisions handed to her:** she supplies facts (a link, an image),
  not layout/ratio/hierarchy choices.

## Architecture

```
Editor (browser) ──▶ /keystatic (Keystatic admin, embedded in the app)
                         │  commits JSON + images
                         ▼
                     GitHub repo (content/media/*.json, public/media/*)
                         │  push triggers
                         ▼
                     Vercel build ──▶ static site reads content via
                                       Keystatic reader + Vimeo oEmbed
```

No server we own runs between edits and publish. The only moving parts are
GitHub (storage + auth) and Vercel (build) — both someone else's uptime.

### Components

1. **Keystatic config** (`keystatic.config.ts`)
   - `storage: { kind: 'github', repo }` (local mode for dev).
   - One collection: `media`, `format: { data: 'json' }`,
     `path: 'content/media/*'`.
   - The collection is the **ordered list** — Keystatic's collection ordering
     (a manifest/order file) is the source of truth for feed order. Reorder =
     drag in the admin UI.
   - Schema per item:
     - `type` — select: `vimeo` | `image` (default `vimeo`).
     - `title` — text (used as `alt` / accessibility label).
     - `vimeoUrl` — text, shown when `type = vimeo`. She pastes the full embed
       code OR the share URL; we parse it (see below). Conditional field.
     - `image` — Keystatic `image` field, shown when `type = image`; writes the
       file into `public/media/` and stores the path. Conditional field.

2. **Vimeo input parsing** (`lib/vimeo.ts`)
   - Accept any of: the full `<iframe …>` paste, `https://vimeo.com/ID/HASH`,
     `https://player.vimeo.com/video/ID?h=HASH`, or a bare `ID`.
   - Extract `{ id, hash }`. Hash is required for unlisted videos (her example
     has `h=0f7a0c0508`).
   - Pure functions, unit-tested against real paste shapes.

3. **Ratio + metadata resolution at build time** (`lib/media-data.ts`)
   - Server-only module. Uses Keystatic's `createReader`
     (`@keystatic/core/reader`) to load the ordered `media` collection.
   - For each `vimeo` item, fetch Vimeo oEmbed
     (`https://vimeo.com/api/oembed.json?url=https://vimeo.com/ID/HASH`) to get
     `width`/`height` → `aspectRatio` (and a fallback title). Results cached
     per build. Network failure → fall back to 16:9 and log, never crash the
     page.
   - Returns a resolved, ordered `ResolvedMediaItem[]` for rendering.

4. **Page split** (`app/page.tsx` → server; `app/Feed.tsx` → client)
   - `page.tsx` becomes a **server component**: calls `getMedia()` from
     `lib/media-data.ts`, passes the resolved list to `<Feed items=… />`.
   - `Feed.tsx` (`"use client"`) holds the existing DialKit tuning sliders and
     layout logic and maps items to `<MediaBlock>`. This is a pure refactor of
     today's `page.tsx` — same layout, sliders, contact/logo chrome.

5. **`MediaBlock` gains a `vimeo` branch** (`app/MediaBlock.tsx`)
   - New case renders our **own** responsive iframe (not her paste-blob) so it
     matches site styling:
     `player.vimeo.com/video/ID?h=HASH&badge=0&autopause=0` inside a wrapper
     using CSS `aspect-ratio: <w>/<h>` from the resolved ratio. No `padding-top`
     hack; no injected `player.js` script.
   - Existing `image` and `video` branches unchanged. (Legacy local-MP4 `video`
     items can remain during migration, then be removed once all are Vimeo.)

### Data flow (order)

Feed order is owned by the Keystatic collection ordering, edited by drag in the
admin. The reader returns items in that order. `media.ts` is deleted once the
collection is seeded with the current 12 items.

## Migration

1. Seed `content/media/*.json` from the existing `media.ts` entries (script or
   by hand — only 12). Existing images move/stay under `public/media/`.
2. Existing MP4 items keep `type: video` until she replaces each with a Vimeo
   link; both branches render during the transition.
3. Delete `media.ts` and its import once the collection is the source of truth.

## Error handling

- **Bad/blank Vimeo paste:** parser returns null → item renders the existing
  labeled placeholder (like today's `missing: true`) instead of a broken embed.
- **oEmbed unreachable at build:** fall back to 16:9, keep building.
- **Missing image file:** existing placeholder path.
- **oEmbed unreliable for unlisted videos (verify in impl):** fallback is a
  3-option ratio select (16:9 / 4:3 / 4:5) she picks — a fact, not a design
  choice. Only added if auto-detect proves flaky.

## Testing

- **Unit:** `lib/vimeo.ts` parsing across all paste shapes incl. her real
  example; ratio math from oEmbed dimensions; oEmbed-failure fallback.
- **Integration:** `getMedia()` reads a fixture collection and returns resolved,
  ordered items with correct ratios.
- **Manual smoke:** `/keystatic` create/edit/reorder in local mode; front page
  renders a vimeo (4:5), a vimeo (16:9), and an image flush in one column.

## Onboarding (deliverable, not code)

- One-time: invite her to the repo; confirm GitHub login to `/keystatic`.
- A short "How to add a video / photo / reorder" note (screenshots), since the
  workflow is the actual product for her.

## Out of scope (YAGNI)

Multiple galleries, captions/rich text, draft/preview states, roles/multi-user,
analytics, image cropping. Single column, add + reorder, nothing more.

## Open items to confirm during implementation

1. Vimeo oEmbed returns correct `width`/`height` for **unlisted** videos when
   passed the hash — verify early; ratio-select fallback ready if not.
2. Whether the DialKit sliders should ship to production at all, or be dev-only
   in the refactored `Feed.tsx` (does not block the CMS work).
