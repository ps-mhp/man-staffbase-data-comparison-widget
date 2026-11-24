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
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ComparisonTable, visibleDimensions } from "./comparison";
import { ComparisonConfig, emptyConfig } from "./comparison-model";
import { sampleConfig } from "./fixtures.testing";
import { ComparisonWidget } from "./widget-root";
import { encodeConfigAttribute } from "./comparison-model";

const rowOf = (label: string): HTMLElement => screen.getByRole("rowheader", { name: new RegExp(label) }).closest("tr")!;

describe("ComparisonTable", () => {
  beforeEach(() => {
    document.documentElement.lang = "de-DE";
  });

  it("zeigt nichts ohne Elemente oder Dimensionen", () => {
    const { container } = render(<ComparisonTable config={emptyConfig()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("zeigt je Element eine Spalte und je Dimension eine Zeile", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    const table = screen.getByRole("table", { name: "Modelle im Vergleich" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getByRole("columnheader", { name: /Modell A/ })).toHaveTextContent("Fernverkehr");
    expect(within(table).getAllByRole("rowheader")).toHaveLength(9);
    expect(screen.getByRole("heading", { name: "Modelle im Vergleich" })).toBeInTheDocument();
  });

  it("schreibt Zahlen mit Einheit und markiert den Bestwert", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    const power = rowOf("Leistung");
    const [a, b] = within(power).getAllByRole("cell");
    expect(a!.querySelector(".man-cmp__number")!.textContent).toBe("510\u202fPS");
    expect(a).toHaveTextContent("Bestwert");
    expect(b).not.toHaveTextContent("Bestwert");
    expect(within(rowOf("Verbrauch")).getAllByRole("cell")[0]!.querySelector(".man-cmp__number")!.textContent).toBe("28,5\u202fl");
  });

  it("zeigt Ja/Nein, Auswahl, Liste, Bewertung und fehlende Angaben", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    expect(within(rowOf("Klimaanlage")).getAllByText("Ja")).toHaveLength(2);
    expect(within(rowOf("Fahrerhaus")).getByText("GM")).toBeInTheDocument();
    expect(within(rowOf("Extras")).getAllByRole("listitem")).toHaveLength(4);
    expect(within(rowOf("Komfort")).getByRole("img", { name: "5 von 5" })).toBeInTheDocument();
    expect(within(rowOf("Notiz")).getByText("keine Angabe")).toBeInTheDocument();
    expect(rowOf("Notiz")).toHaveTextContent("Kurz");
  });

  it("zeigt Icons der Bibliothek an Dimension, Element und Ja/Nein", () => {
    const config = sampleConfig();
    config.dimensions[3] = { ...config.dimensions[3]!, icon: "craft/check", noIcon: "craft/minus" };
    config.items[0] = { ...config.items[0]!, icon: "craft/truck-check", values: { ...config.items[0]!.values, ac: false } };
    render(<ComparisonTable config={config} />);
    expect(rowOf("Klimaanlage").querySelector('th [data-man-icon="craft/check"]')).not.toBeNull();
    const [a, b] = within(rowOf("Klimaanlage")).getAllByRole("cell");
    expect(a!.querySelector("[data-man-icon]")).toHaveAttribute("data-man-icon", "craft/minus");
    expect(b!.querySelector("[data-man-icon]")).toHaveAttribute("data-man-icon", "man/checkmark");
    expect(screen.getByRole("columnheader", { name: /Modell A/ }).querySelector('[data-man-icon="craft/truck-check"]')).not.toBeNull();
  });

  it("färbt Ja/Nein mit eigenen Farben über eine Variable", () => {
    const config = sampleConfig();
    config.dimensions[3] = { ...config.dimensions[3]!, yesColor: "#2d6300" };
    render(<ComparisonTable config={config} />);
    const mark = within(rowOf("Klimaanlage")).getAllByRole("cell")[0]!.querySelector(".man-cmp__bool")!;
    expect((mark as HTMLElement).style.getPropertyValue("--cmp-bool-color")).toBe("#2d6300");
  });

  it("zentriert Werte, nur die Merkmale stehen links", () => {
    const { container } = render(<ComparisonTable config={sampleConfig()} />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain("text-align: var(--cmp-cell-align, center) !important");
  });

  it("blendet gleiche Zeilen ab, nie die Galerie", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    expect(rowOf("Klimaanlage")).toHaveClass("man-cmp__row--same");
    expect(rowOf("Leistung")).not.toHaveClass("man-cmp__row--same");
    expect(rowOf("Bilder")).not.toHaveClass("man-cmp__row--same");
  });

  it("lässt Abblenden und Bestwerte abschalten", () => {
    render(<ComparisonTable config={{ ...sampleConfig(), highlightDifferences: false, markBest: false }} />);
    expect(rowOf("Klimaanlage")).not.toHaveClass("man-cmp__row--same");
    expect(screen.queryByText("Bestwert")).not.toBeInTheDocument();
  });

  it("lässt Zeilen ohne jeden Wert weg", () => {
    const config: ComparisonConfig = {
      ...sampleConfig(),
      dimensions: [...sampleConfig().dimensions, { id: "leer", label: "Leer", type: "text" }],
    };
    render(<ComparisonTable config={config} />);
    expect(screen.queryByRole("rowheader", { name: "Leer" })).not.toBeInTheDocument();
  });

  it("bietet Leser:innen auf Wunsch „Nur Unterschiede“", async () => {
    render(<ComparisonTable config={{ ...sampleConfig(), differenceToggle: true }} />);
    const toggle = screen.getByRole("button", { name: "Nur Unterschiede" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("rowheader", { name: /Klimaanlage/ })).not.toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Leistung/ })).toBeInTheDocument();
    // Die Galerie vergleicht nichts und bleibt deshalb stehen.
    expect(screen.getByRole("rowheader", { name: /Bilder/ })).toBeInTheDocument();
  });

  it("zeigt den Schalter nicht ohne die Einstellung", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    expect(screen.queryByRole("button", { name: "Nur Unterschiede" })).not.toBeInTheDocument();
  });

  it("meldet, wenn nichts verschieden ist", async () => {
    const same = sampleConfig();
    const config: ComparisonConfig = { ...same, differenceToggle: true, dimensions: same.dimensions.filter((entry) => ["ac", "wheels", "pics"].includes(entry.id)) };
    render(<ComparisonTable config={config} />);
    await userEvent.click(screen.getByRole("button", { name: "Nur Unterschiede" }));
    expect(screen.getByText("Die Elemente unterscheiden sich in keinem Merkmal.")).toBeInTheDocument();
  });

  it("legt beim Scrollen einen Schatten an die stehende Spalte", () => {
    render(<ComparisonTable config={sampleConfig()} />);
    const scroller = screen.getByRole("region", { name: /waagerecht scrollbar/ });
    expect(scroller).not.toHaveAttribute("data-scrolled");
    act(() => {
      scroller.scrollLeft = 40;
      fireEvent.scroll(scroller);
    });
    expect(scroller).toHaveAttribute("data-scrolled");
  });

  it("trägt die Akzentfarbe und das Stylesheet", () => {
    const { container } = render(<ComparisonTable config={{ ...sampleConfig(), accent: "blue" }} />);
    expect(screen.getByTestId("cmp-widget")).toHaveAttribute("data-accent", "blue");
    expect(container.querySelector("style")?.textContent).toContain("position: sticky");
  });
});

describe("Breite", () => {
  const original = globalThis.ResizeObserver;
  afterEach(() => {
    globalThis.ResizeObserver = original;
  });

  it("rückt zusammen, wenn der Vergleich selbst schmal ist", () => {
    let report: ResizeObserverCallback = () => undefined;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        report = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
    render(<ComparisonTable config={sampleConfig()} />);
    const root = screen.getByTestId("cmp-widget");
    const resize = (width: number): void =>
      act(() => report([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver));
    resize(400);
    expect(root).toHaveAttribute("data-narrow");
    resize(900);
    expect(root).not.toHaveAttribute("data-narrow");
  });
});

describe("visibleDimensions", () => {
  it("filtert leere und – auf Wunsch – gleiche Zeilen", () => {
    const config = sampleConfig();
    expect(visibleDimensions(config, false)).toHaveLength(9);
    expect(visibleDimensions(config, true).map((entry) => entry.id)).toEqual(["pics", "power", "fuel", "cab", "note", "stars"]);
  });
});

describe("ComparisonWidget", () => {
  it("liest das Attribut und zeigt die Tabelle", () => {
    render(<ComparisonWidget config={encodeConfigAttribute(sampleConfig())} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("bleibt bei Unlesbarem leer", () => {
    const { container } = render(<ComparisonWidget config="{kaputt" />);
    expect(container).toBeEmptyDOMElement();
  });
});
