"use client";

import { useEffect } from "react";
import { useDialKit } from "dialkit";
import { media } from "./media";
import { MediaBlock } from "./MediaBlock";

export default function Home() {
  const {
    blackBackground,
    logoMinWidth,
    logoMaxWidth,
    sidePadding,
    logoBottomPadding,
    contactTopPadding,
    mediaGap,
  } = useDialKit("Layout", {
    // toggle: pure black vs. white
    blackBackground: true,
    // Logo scales fluidly (56vw - 190px) clamped by the min/max sliders.
    logoMinWidth: [240, 40, 600, 2], // px floor
    logoMaxWidth: [300, 120, 1200, 2], // px ceiling
    // Symmetric left+right padding on media (desktop target; tapers to 0 on mobile)
    sidePadding: [276, 0, 400, 4],
    // spacing sliders — [value, min, max, step]; snap to a 4pt grid
    contactTopPadding: [24, 0, 120, 4],
    logoBottomPadding: [32, 0, 120, 4],
    mediaGap: [48, 0, 160, 4],
  });

  // Side padding tapers linearly: 0 at <=500px screen -> full value at >=1440px.
  const SIDE_ZERO = 500;
  const SIDE_REACH = 1440;
  const sideSlope = (sidePadding / (SIDE_REACH - SIDE_ZERO)).toFixed(5);
  const sidePad = `clamp(0px, calc((100vw - ${SIDE_ZERO}px) * ${sideSlope}), ${sidePadding}px)`;

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", blackBackground);
  }, [blackBackground]);

  return (
    <>
      {/* Fixed Contact (top) */}
      <header className="contact" style={{ top: contactTopPadding }}>
        <a href="mailto:contact@wyattwoodby.com">Contact</a>
      </header>

      {/* Scrolling media column — first & last items are flush to the edges */}
      <main
        className="feed"
        style={{
          gap: mediaGap,
          paddingLeft: sidePad,
          paddingRight: sidePad,
        }}
      >
        {media.map((item) => (
          <MediaBlock key={item.id} item={item} />
        ))}
      </main>

      {/* Fixed logo (bottom) */}
      <footer className="logo" style={{ bottom: logoBottomPadding }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/logo.svg"
          alt="Wyatt Woodby"
          style={{
            width: `clamp(${logoMinWidth}px, 56vw - 190px, ${logoMaxWidth}px)`,
          }}
        />
      </footer>
    </>
  );
}
