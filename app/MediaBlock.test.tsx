import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaBlock } from "./MediaBlock";

describe("MediaBlock vimeo branch", () => {
  it("renders a muted autoplay iframe at the correct aspect ratio with a play button", () => {
    render(
      <MediaBlock
        item={{ kind: "vimeo", id: "clip", title: "Clip", vimeoId: "1218700554", hash: "0f7a0c0508", width: 1080, height: 1350 }}
      />,
    );
    const frame = screen.getByTitle("Clip") as HTMLIFrameElement;
    expect(frame.getAttribute("src")).toContain("player.vimeo.com/video/1218700554");
    expect(frame.getAttribute("src")).toContain("muted=1");
    const wrapper = frame.closest(".block--vimeo") as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe("1080 / 1350");
    expect(screen.getByLabelText("Play Clip with sound")).toBeInTheDocument();
  });

  it("renders a placeholder for a missing item", () => {
    render(<MediaBlock item={{ kind: "missing", id: "x", title: "Gone" }} />);
    expect(screen.getByText("Gone")).toBeInTheDocument();
  });
});
