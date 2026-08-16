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
