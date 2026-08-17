import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaBlock } from "./MediaBlock";

describe("MediaBlock vimeo branch", () => {
  it("renders a single muted autoplay iframe with native Vimeo controls at the correct aspect ratio", () => {
    render(
      <MediaBlock
        item={{ kind: "vimeo", id: "clip", title: "Clip", vimeoId: "1218700554", hash: "0f7a0c0508", width: 1080, height: 1350 }}
      />,
    );
    const frames = screen.getAllByTitle("Clip");
    expect(frames).toHaveLength(1);
    const frame = frames[0] as HTMLIFrameElement;
    expect(frame.getAttribute("src")).toContain("player.vimeo.com/video/1218700554");
    expect(frame.getAttribute("src")).toContain("muted=1");
    expect(frame.getAttribute("src")).toContain("loop=1");
    expect(frame.getAttribute("src")).toContain("controls=1");
    const wrapper = frame.closest(".block--vimeo") as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe("1080 / 1350");
    // No custom play button — Vimeo's native control bar is used instead.
    expect(screen.queryByLabelText("Play Clip with sound")).not.toBeInTheDocument();
    expect(document.querySelector(".playbtn")).toBeNull();
  });

  it("renders a placeholder for a missing item", () => {
    render(<MediaBlock item={{ kind: "missing", id: "x", title: "Gone" }} />);
    expect(screen.getByText("Gone")).toBeInTheDocument();
  });
});
