"use client";

import { useRef, useState } from "react";
import type { MediaItem } from "./media";

export function MediaBlock({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  if (item.missing) {
    return (
      <div className="block placeholder" aria-label={item.alt}>
        <span className="placeholder__label">{item.alt}</span>
        <span className="placeholder__hint">add file</span>
      </div>
    );
  }

  if (item.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="block" src={item.src} alt={item.alt} />;
  }

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
        <button className="playbtn" onClick={play} aria-label={`Play ${item.alt}`}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
