// Ordered top-to-bottom to match the Figma "Order" frame (node 4:275).
// Hidden-in-frame items (05_BLOWING, 01_TEASER) are intentionally omitted.
//
// To swap a clip for Vimeo later: set `type: "vimeo"` and put the embed URL in `src`.
// Missing source files are marked `missing: true` and render as a labeled placeholder.

export type MediaItem = {
  id: string;
  type: "video" | "image";
  src: string;
  poster?: string;
  alt: string;
  missing?: boolean;
};

export const media: MediaItem[] = [
  { id: "opportunity_for_two", type: "video", src: "/media/opportunity_for_two.mp4", poster: "/media/posters/opportunity_for_two.jpg", alt: "Opportunity for Two" },
  { id: "photo_two_render", type: "image", src: "/media/photo_two_render.jpg", alt: "Photo Two" },
  { id: "roomba_edit", type: "video", src: "/media/roomba.edit.422.mp4", poster: "/media/posters/roomba_edit.jpg", alt: "Roomba Edit" },
  { id: "photo_1_render_crop", type: "image", src: "/media/photo_1_render_crop.jpg", alt: "Photo One" },
  { id: "apartment", type: "video", src: "/media/apartment.mp4", poster: "/media/posters/apartment.jpg", alt: "Apartment" },
  { id: "BLOOMING_16x9_30s", type: "video", src: "/media/BLOOMING_16x9_30s.mp4", poster: "/media/posters/BLOOMING_16x9_30s.jpg", alt: "Blooming" },
  { id: "WIND_16x9_30s", type: "video", src: "/media/WIND_16x9_30s.mp4", poster: "/media/posters/WIND_16x9_30s.jpg", alt: "Wind" },
  { id: "TRIO_16x9_30s", type: "video", src: "/media/TRIO_16x9_30s.mp4", poster: "/media/posters/TRIO_16x9_30s.jpg", alt: "Trio" },
  { id: "06_HIDING_16x9", type: "video", src: "/media/06_HIDING_16x9.mp4", poster: "/media/posters/06_HIDING_16x9.jpg", alt: "Hiding" },
  { id: "chaos_edit", type: "video", src: "/media/chaos_edit.mp4", poster: "/media/posters/chaos_edit.jpg", alt: "Chaos Edit" },
  { id: "gagosian_render", type: "image", src: "/media/gagosian_render.jpg", alt: "Gagosian" },
  { id: "biere_three", type: "video", src: "/media/biere_three.mp4", poster: "/media/posters/biere_three.jpg", alt: "Biere Three" },
];
