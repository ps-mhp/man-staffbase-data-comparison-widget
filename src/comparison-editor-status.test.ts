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

import { comparisonChangesStatus, validateComparison } from "./comparison-editor-status";
import { ComparisonConfig, emptyConfig } from "./comparison-model";
import { sampleConfig } from "./fixtures.testing";

describe("validateComparison", () => {
  it("lässt einen vollständigen Vergleich durch", () => {
    expect(validateComparison(sampleConfig())).toEqual([]);
  });

  it("nennt Elemente und Dimensionen ohne Namen und Auswahlen ohne Optionen", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [
        { id: "d1", label: " ", type: "text" },
        { id: "d2", label: "Kabine", type: "choice", options: [] },
        { id: "d3", label: "Farbe", type: "choice", options: [{ id: "o", label: "" }] },
        { id: "d4", label: "Leistung", type: "number", units: [{ id: "a", label: "PS" }, { id: "b", label: " " }] },
      ],
      items: [{ id: "a", name: "", values: {} }],
    };
    expect(validateComparison(config)).toEqual([
      { id: "a", message: "Element 1: Name fehlt" },
      { id: "d1", message: "Dimension 1: Name fehlt" },
      { id: "d2", message: "Dimension 2: Auswahl ohne Optionen" },
      { id: "d3", message: "Dimension 3: Option ohne Namen" },
      { id: "d4", message: "Dimension 4: Einheit ohne Namen" },
    ]);
  });
});

describe("comparisonChangesStatus", () => {
  it("schweigt ohne Änderung", () => {
    expect(comparisonChangesStatus(sampleConfig(), sampleConfig())).toBeUndefined();
  });

  it("zählt geänderte Elemente und Dimensionen", () => {
    const saved = sampleConfig();
    const draft: ComparisonConfig = {
      ...saved,
      items: saved.items.map((item) => ({ ...item, name: `${item.name}!` })),
      dimensions: saved.dimensions.slice(1),
    };
    expect(comparisonChangesStatus(draft, saved)).toBe("2 Elemente geändert · 1 Dimension geändert");
  });

  it("meldet eine neue Reihenfolge und Einstellungen", () => {
    const saved = sampleConfig();
    const draft: ComparisonConfig = { ...saved, items: [...saved.items].reverse(), accent: "grey" };
    expect(comparisonChangesStatus(draft, saved)).toBe("Reihenfolge der Elemente geändert · Einstellungen geändert");
  });
});
