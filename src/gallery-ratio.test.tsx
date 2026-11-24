/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { act, render, screen, within } from "@testing-library/react";

import { ComparisonTable } from "./comparison";
import { ComparisonConfig, emptyConfig } from "./comparison-model";
import { FALLBACK_RATIO, MAX_RATIO, MIN_RATIO, frameRatio, useGalleryRatio } from "./gallery-ratio";

describe("frameRatio", () => {
  it("nimmt das kleinste Verhältnis – das höchste Bild", () => {
    expect(frameRatio([16 / 9, 3 / 4, 4 / 3])).toBe(3 / 4);
  });

  it("nimmt ohne Maße die Vorgabe und begrenzt Ausreißer", () => {
    expect(frameRatio([undefined])).toBe(FALLBACK_RATIO);
    expect(frameRatio([0.1])).toBe(MIN_RATIO);
    expect(frameRatio([9])).toBe(MAX_RATIO);
  });
});

describe("useGalleryRatio", () => {
  const original = globalThis.Image;
  afterEach(() => {
    globalThis.Image = original;
  });

  it("misst Bilder ohne Maße nach", () => {
    const probes: { onload: (() => void) | null; naturalWidth: number; naturalHeight: number; src: string }[] = [];
    globalThis.Image = class {
      onload: (() => void) | null = null;
      naturalWidth = 0;
      naturalHeight = 0;
      src = "";
      constructor() {
        probes.push(this);
      }
    } as unknown as typeof Image;

    function Probe(): React.ReactElement {
      return <span data-testid="ratio">{useGalleryRatio([{ url: "https://example.com/hoch.jpg", alt: "" }, { url: "https://example.com/quer.jpg", alt: "", width: 1600, height: 900 }])}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("ratio")).toHaveTextContent(String(16 / 9));
    expect(probes).toHaveLength(1);
    act(() => {
      Object.assign(probes[0]!, { naturalWidth: 600, naturalHeight: 1200 });
      probes[0]!.onload?.();
    });
    expect(screen.getByTestId("ratio")).toHaveTextContent("0.5");
  });
});

describe("Galerie-Zeile", () => {
  it("gibt allen Zellen den Rahmen des höchsten Bildes und beschneidet nicht", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "g", label: "Bilder", type: "gallery" }],
      items: [
        { id: "a", name: "A", values: { g: [{ url: "https://example.com/a.jpg", alt: "", width: 1200, height: 800 }] } },
        { id: "b", name: "B", values: { g: [{ url: "https://example.com/b.jpg", alt: "", width: 600, height: 800 }] } },
      ],
    };
    const { container } = render(<ComparisonTable config={config} />);
    const frames = Array.from(container.querySelectorAll<HTMLElement>(".man-cmp-gallery__frame"));
    expect(frames.map((frame) => frame.style.aspectRatio)).toEqual(["0.75", "0.75"]);
    expect(within(screen.getByRole("table")).getAllByRole("img").length).toBeGreaterThan(0);
    expect(container.querySelector("style")!.textContent).toContain("object-fit: contain");
  });
});
