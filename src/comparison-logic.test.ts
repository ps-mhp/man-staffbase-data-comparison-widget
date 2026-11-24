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

import { bestItemIds, formatNumber, rowDiffers, rowHasValues } from "./comparison-logic";
import { ComparisonItem, Dimension } from "./comparison-model";
import { sampleConfig } from "./fixtures.testing";

const config = sampleConfig();
const dimension = (id: string): Dimension => config.dimensions.find((entry) => entry.id === id)!;

describe("rowDiffers", () => {
  it("erkennt Unterschiede und Gleichstand", () => {
    expect(rowDiffers(config.items, dimension("power"))).toBe(true);
    expect(rowDiffers(config.items, dimension("ac"))).toBe(false);
    expect(rowDiffers(config.items, dimension("wheels"))).toBe(false);
  });

  it("sieht Listen als Mengen", () => {
    expect(rowDiffers(config.items, dimension("extras"))).toBe(false);
  });

  it("zählt „keine Angabe“ als eigenen Wert", () => {
    expect(rowDiffers(config.items, dimension("note"))).toBe(true);
  });

  it("vergleicht die Galerie nie und ein einzelnes Element nicht", () => {
    expect(rowDiffers(config.items, dimension("pics"))).toBe(false);
    expect(rowDiffers(config.items.slice(0, 1), dimension("power"))).toBe(false);
  });
});

describe("bestItemIds", () => {
  it("markiert die höchste Zahl, wenn höher besser ist", () => {
    expect([...bestItemIds(config.items, dimension("power"))]).toEqual(["a"]);
  });

  it("markiert die niedrigste Zahl, wenn niedriger besser ist", () => {
    expect([...bestItemIds(config.items, dimension("fuel"))]).toEqual(["b"]);
  });

  it("markiert bei Bewertungen die meisten Sterne", () => {
    expect([...bestItemIds(config.items, dimension("stars"))]).toEqual(["b"]);
  });

  it("markiert nichts ohne Vorzug, bei Gleichstand aller oder mit nur einem Wert", () => {
    expect(bestItemIds(config.items, dimension("wheels")).size).toBe(0);
    const tie: ComparisonItem[] = config.items.map((item) => ({ ...item, values: { ...item.values, power: 400 } }));
    expect(bestItemIds(tie, dimension("power")).size).toBe(0);
    const lonely: ComparisonItem[] = [config.items[0]!, { ...config.items[1]!, values: {} }];
    expect(bestItemIds(lonely, dimension("power")).size).toBe(0);
  });

  it("markiert alle, die sich den Bestwert teilen", () => {
    const items: ComparisonItem[] = [
      ...config.items,
      { id: "c", name: "C", values: { power: 510 } },
    ];
    expect([...bestItemIds(items, dimension("power"))].sort()).toEqual(["a", "c"]);
  });
});

describe("rowHasValues", () => {
  it("ist falsch, wenn kein Element einen Wert trägt", () => {
    expect(rowHasValues(config.items, dimension("power"))).toBe(true);
    expect(rowHasValues(config.items, { id: "leer", label: "Leer", type: "text" })).toBe(false);
  });
});

describe("formatNumber", () => {
  it("schreibt Zahlen in der Sprache der Seite mit Einheit", () => {
    expect(formatNumber(1234.5, "PS", "de-DE")).toBe("1.234,5\u202fPS");
    expect(formatNumber(1234.5, undefined, "en-US")).toBe("1,234.5");
    expect(formatNumber(12, "%", "de-DE")).toBe("12%");
  });

  it("fällt bei unbekannter Sprache auf die des Browsers zurück", () => {
    expect(formatNumber(3, "", "kein-gültiges-tag-!!")).toBe("3");
  });
});
