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

import { parseConfig, encodeConfigAttribute } from "./comparison-model";
import { sampleConfig } from "./fixtures.testing";
import { FIELD_ATTRIBUTE, comparisonTranslationProvider as provider, configFields } from "./translation-provider";

/** Übersetzt jeden Textknoten, indem es „EN:“ voranstellt — wie der Dienst, nur vorhersagbar; Markup bleibt. */
function fakeTranslate(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.body.querySelectorAll(`[${FIELD_ATTRIBUTE}]`).forEach((element) => {
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    texts.filter((text) => (text.textContent ?? "").trim() !== "").forEach((text) => {
      text.textContent = `EN:${text.textContent ?? ""}`;
    });
  });
  return doc.body.innerHTML;
}

describe("comparisonTranslationProvider", () => {
  const stored = encodeConfigAttribute(sampleConfig());

  it("schickt alle Texte, aber keine Zahlen, Kennungen oder Adressen", () => {
    const html = provider.toTranslatable(stored)!;
    expect(html).toContain("Modelle im Vergleich");
    expect(html).toContain("Leistung");
    expect(html).toContain("PS");
    expect(html).toContain("Tempomat");
    expect(html).toContain("A vorne");
    expect(html).toContain(">GX<");
    expect(html).not.toContain("example.com");
    expect(html).not.toContain(">510<");
  });

  it("schickt Fließtext als Markup und behält Absätze, Aufzählungen und Icons", () => {
    const config = sampleConfig();
    config.items[0]!.values.note = '<p>Erste <span data-man-icon="craft/check"></span></p><ul><li>Punkt</li></ul>';
    config.items[0]!.values.extras = ['Tempomat <span data-man-icon="craft/check"></span>'];
    const source = encodeConfigAttribute(config);
    const translated = parseConfig(provider.fromTranslated(fakeTranslate(provider.toTranslatable(source)!), source)!);
    const note = translated.items[0]!.values.note as string;
    expect(note).toMatch(/^<p>EN:Erste <span data-man-icon="craft\/check"[^>]*><\/span><\/p><ul><li>EN:Punkt<\/li><\/ul>$/);
    expect((translated.items[0]!.values.extras as string[])[0]).toMatch(/^EN:Tempomat <span data-man-icon="craft\/check"/);
  });

  it("findet die Schlüssel auch bei von Hand geschriebenem JSON ohne Kennungen", () => {
    const raw = JSON.stringify({ dimensions: [{ label: "Farbe", type: "text" }], items: [{ name: "A", values: { "d-0": "Rot" } }] });
    const translated = parseConfig(provider.fromTranslated(fakeTranslate(provider.toTranslatable(raw)!), raw)!);
    expect(translated.items[0]).toMatchObject({ name: "EN:A", values: { "d-0": "<p>EN:Rot</p>" } });
  });

  it("gibt nichts zu übersetzen ohne Texte", () => {
    expect(provider.toTranslatable("")).toBeNull();
  });

  it("setzt die Übersetzung ein und lässt Werte, Bilder und Reihenfolge stehen", () => {
    const translated = provider.fromTranslated(fakeTranslate(provider.toTranslatable(stored)!), stored)!;
    const config = parseConfig(translated);
    expect(config.heading).toBe("EN:Modelle im Vergleich");
    expect(config.dimensions[1]).toMatchObject({ label: "EN:Leistung", unit: "EN:PS", prefer: "higher" });
    expect(config.dimensions[4]!.options![0]).toMatchObject({ id: "gx", label: "EN:GX" });
    expect(config.items[0]).toMatchObject({ name: "EN:Modell A", subtitle: "EN:Fernverkehr" });
    expect(config.items[0]!.values).toMatchObject({
      power: 510,
      ac: true,
      cab: "gx",
      extras: ["EN:Tempomat", "EN:Kühlbox"],
      note: "<p>EN:Gut</p>",
      pics: [
        { url: "https://example.com/a1.jpg", alt: "EN:A vorne" },
        { url: "https://example.com/a2.jpg", alt: "EN:A hinten" },
      ],
    });
  });

  it("behält die Quellsprache, wo die Übersetzung leer zurückkommt", () => {
    const translated = provider.fromTranslated(`<div><p ${FIELD_ATTRIBUTE}="heading"> </p></div>`, stored)!;
    expect(parseConfig(translated).heading).toBe("Modelle im Vergleich");
  });

  it("erkennt die eigene Übersetzung am Feldattribut", () => {
    expect(provider.acceptsTranslated(`<p ${FIELD_ATTRIBUTE}="x">a</p>`)).toBe(true);
    expect(provider.acceptsTranslated("<p>a</p>")).toBe(false);
  });

  it("maskiert Markup in Texten", () => {
    const config = { ...sampleConfig(), heading: "<b>Fett</b> & mehr" };
    expect(configFields(config)[0]).toEqual({ key: "heading", text: "<b>Fett</b> & mehr" });
    expect(provider.toTranslatable(encodeConfigAttribute(config))).toContain("&lt;b&gt;Fett&lt;/b&gt; &amp; mehr");
  });
});
