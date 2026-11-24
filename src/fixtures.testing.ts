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

/** Ein Vergleich mit jedem Typ, für die Tests. */

import { ComparisonConfig, emptyConfig } from "./comparison-model";

export const sampleConfig = (): ComparisonConfig => ({
  ...emptyConfig(),
  heading: "Modelle im Vergleich",
  // Alle Zeilen offen; das Einklappen prüfen eigene Tests.
  visibleRows: 0,
  dimensions: [
    { id: "pics", label: "Bilder", type: "gallery" },
    { id: "power", label: "Leistung", type: "number", units: [{ id: "ps", label: "PS" }], prefer: "higher" },
    { id: "fuel", label: "Verbrauch", type: "number", units: [{ id: "l", label: "l" }], prefer: "lower" },
    { id: "ac", label: "Klimaanlage", type: "bool" },
    { id: "cab", label: "Fahrerhaus", type: "choice", options: [{ id: "gx", label: "GX" }, { id: "gm", label: "GM" }] },
    { id: "extras", label: "Extras", type: "list" },
    { id: "note", label: "Notiz", type: "text", hint: "Kurz" },
    { id: "stars", label: "Komfort", type: "rating" },
    { id: "wheels", label: "Räder", type: "number" },
  ],
  items: [
    {
      id: "a",
      name: "Modell A",
      subtitle: "Fernverkehr",
      values: {
        pics: [
          { url: "https://example.com/a1.jpg", alt: "A vorne" },
          { url: "https://example.com/a2.jpg", alt: "A hinten" },
        ],
        power: 510,
        fuel: 28.5,
        ac: true,
        cab: "gx",
        extras: ["Tempomat", "Kühlbox"],
        note: "<p>Gut</p>",
        stars: 4,
        wheels: 6,
      },
    },
    {
      id: "b",
      name: "Modell B",
      values: {
        pics: [{ url: "https://example.com/b1.jpg", alt: "B" }],
        power: 470,
        fuel: 27,
        ac: true,
        cab: "gm",
        extras: ["Kühlbox", "Tempomat"],
        stars: 5,
        wheels: 6,
      },
    },
  ],
});
