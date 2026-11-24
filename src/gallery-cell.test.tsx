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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GalleryCell } from "./gallery-cell";

const IMAGES = [
  { url: "https://example.com/1.jpg", alt: "Eins" },
  { url: "https://example.com/2.jpg", alt: "Zwei" },
  { url: "https://example.com/3.jpg", alt: "" },
];

const shown = (): HTMLElement => screen.getByTestId("cmp-gallery").querySelector(".man-cmp-gallery__image")!;

describe("GalleryCell", () => {
  it("zeigt nichts ohne Bilder", () => {
    const { container } = render(<GalleryCell images={[]} label="A" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("benennt Bilder ohne Beschreibung nach Element und Stelle", () => {
    render(<GalleryCell images={[IMAGES[2]!, IMAGES[0]!]} label="Bilder: A" />);
    expect(shown()).toHaveAttribute("alt", "Bilder: A – Bild 1 von 2");
    expect(screen.getByRole("status")).toHaveTextContent("Bild 1 von 2");
  });

  it("zeigt ein einzelnes Bild ohne Pfeile, aber mit Vergrößern", () => {
    render(<GalleryCell images={IMAGES.slice(0, 1)} label="A" />);
    expect(screen.queryByRole("button", { name: "Nächstes Bild" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bild vergrößern" })).toBeInTheDocument();
  });

  it("blättert mit den Pfeilen im Kreis", async () => {
    render(<GalleryCell images={IMAGES} label="A" />);
    expect(shown()).toHaveAttribute("alt", "Eins");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nächstes Bild" }));
    expect(shown()).toHaveAttribute("alt", "Zwei");
    await userEvent.click(screen.getByRole("button", { name: "Vorheriges Bild" }));
    await userEvent.click(screen.getByRole("button", { name: "Vorheriges Bild" }));
    expect(shown()).toHaveAttribute("src", "https://example.com/3.jpg");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("vergrößert im Dialog, blättert dort mit Pfeiltasten und schließt", async () => {
    render(<GalleryCell images={IMAGES} label="Bilder: A" />);
    const dialog = document.querySelector("dialog")!;
    expect(dialog.open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Bild vergrößern" }));
    expect(dialog.open).toBe(true);
    expect(dialog).toHaveAttribute("aria-label", "Bilder: A");
    expect(dialog.querySelector("img")).toHaveAttribute("alt", "Eins");
    expect(dialog.querySelector("figcaption")).toHaveTextContent("Eins");

    await userEvent.keyboard("{ArrowRight}");
    expect(dialog.querySelector("img")).toHaveAttribute("alt", "Zwei");
    // Vorschau in der Zelle folgt dem Dialog.
    expect(shown()).toHaveAttribute("alt", "Zwei");

    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(dialog.open).toBe(false);
    expect(screen.getByRole("button", { name: "Bild vergrößern" })).toHaveFocus();
  });
});
