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
