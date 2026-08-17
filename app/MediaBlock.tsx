"use client";

import type { ResolvedMediaItem } from "../lib/media-data";
import { buildEmbedSrc } from "../lib/vimeo";

export function MediaBlock({ item }: { item: ResolvedMediaItem }) {
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

  return <VimeoBlock item={item} />;
}

function VimeoBlock({ item }: { item: Extract<ResolvedMediaItem, { kind: "vimeo" }> }) {
  // Muted autoplay loop with Vimeo's native controls. The viewer unmutes,
  // pauses, or goes fullscreen using Vimeo's own control bar.
  const ref = { id: item.vimeoId, hash: item.hash };
  const src = buildEmbedSrc(ref, { autoplay: true, muted: true, loop: true, controls: true });

  return (
    <div className="block block--vimeo" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
      <iframe
        src={src}
        title={item.title}
        frameBorder={0}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
