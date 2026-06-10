import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { Header } from "./header";

describe("Header", () => {
  it("renders the app name", () => {
    render(<Header />);
    expect(screen.getByText(en.app.name)).toBeDefined();
  });

  it("renders the initial level and rank", () => {
    render(<Header />);
    expect(screen.getByText(`${en.header.level} 1`)).toBeDefined();
    expect(screen.getByText(en.ranks.compileRookie)).toBeDefined();
  });

  it("renders the XP progress bar at zero", () => {
    render(<Header />);
    const bar = screen.getByRole("progressbar", { name: en.header.xp });
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("50");
  });

  it("renders all five sector filter pills with All active", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: en.header.sectorFilterAria });
    const pills = Array.from(nav.querySelectorAll("button"));
    expect(pills).toHaveLength(5);
    expect(pills.map((p) => p.textContent)).toEqual([
      en.sectors.all,
      en.sectors.ml,
      en.sectors.dl,
      en.sectors.fullstack,
      en.sectors.db,
    ]);
    expect(pills[0]?.getAttribute("aria-pressed")).toBe("true");
  });
});
