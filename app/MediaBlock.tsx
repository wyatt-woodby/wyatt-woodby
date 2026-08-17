"use client";

import { useState } from "react";
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
  // Resting state: muted autoplay loop, no controls. On click we swap the src to
  // an unmuted player with controls (clicking reloads the iframe with sound).
  const [active, setActive] = useState(false);
  const ref = { id: item.vimeoId, hash: item.hash };
  const src = active
    ? buildEmbedSrc(ref, { autoplay: true, muted: false, loop: true, controls: true })
    : buildEmbedSrc(ref, { autoplay: true, muted: true, loop: true, controls: false });

  return (
    <div
      className={`block block--vimeo${active ? " is-active" : ""}`}
      style={{ aspectRatio: `${item.width} / ${item.height}` }}
    >
      <iframe
        src={src}
        title={item.title}
        frameBorder={0}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {!active && (
        <button className="playbtn" onClick={() => setActive(true)} aria-label={`Play ${item.title} with sound`}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
