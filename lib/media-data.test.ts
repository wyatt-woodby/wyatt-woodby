import { resolve } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMedia, __resetDimsCache } from "./media-data";

const ROOT = resolve(process.cwd(), "test/fixtures");

beforeEach(() => {
  __resetDimsCache();
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
    expect(clip).toMatchObject({ kind: "vimeo", vimeoId: "1218700554", hash: "0f7a0c0508", width: 1080, height: 1350 });
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
