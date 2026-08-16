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
