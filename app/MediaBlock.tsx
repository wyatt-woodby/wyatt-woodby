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
