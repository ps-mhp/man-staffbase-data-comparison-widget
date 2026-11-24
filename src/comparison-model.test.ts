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

import { decodePayload } from "@shared/payload";

import {
  ComparisonConfig,
  Dimension,
  MAX_ITEMS,
  changeDimensionType,
  convertValue,
  emptyConfig,
  encodeConfigAttribute,
  hasContent,
  isSafeImageUrl,
  normalizeValue,
  parseConfig,
  parseNumber,
  serializeConfigJson,
  setItemValue,
  usedIconIds,
  usedColors,
  duplicateDimension,
  MAX_DIMENSIONS,
  DEFAULT_NO_ICON,
  DEFAULT_YES_ICON,
} from "./comparison-model";
import { sampleConfig } from "./fixtures.testing";

const dim = (type: Dimension["type"], extra: Partial<Dimension> = {}): Dimension => ({ id: "d", label: "D", type, ...extra });

describe("parseConfig", () => {
  it("ergibt für Leeres und Kaputtes den leeren Vergleich", () => {
    expect(parseConfig(undefined)).toEqual(emptyConfig());
    expect(parseConfig("")).toEqual(emptyConfig());
    expect(parseConfig("{kaputt")).toEqual(emptyConfig());
    expect(parseConfig("[]")).toEqual(emptyConfig());
    expect(parseConfig("b64:%%%")).toEqual(emptyConfig());
  });

  it("liest, was der Editor schreibt, unverändert zurück", () => {
    const config = sampleConfig();
    expect(parseConfig(encodeConfigAttribute(config))).toEqual(config);
  });

  it("liest rohes JSON", () => {
    const parsed = parseConfig('{"dimensions":[{"id":"p","label":"PS","type":"number"}],"items":[{"id":"a","name":"A","values":{"p":"1,5"}}]}');
    expect(parsed.items[0]!.values).toEqual({ p: 1.5 });
  });

  it("verwirft Werte gelöschter Dimensionen und solche in falscher Form", () => {
    const parsed = parseConfig(
      JSON.stringify({
        dimensions: [{ id: "b", label: "B", type: "bool" }],
        items: [{ id: "a", name: "A", values: { b: "ja", weg: 1 } }],
      }),
    );
    expect(parsed.items[0]!.values).toEqual({});
  });

  it("leitet fehlende und doppelte Kennungen aus der Stelle ab – bei jedem Lesen gleich", () => {
    const raw = JSON.stringify({
      dimensions: [{ label: "A" }, { id: "x", label: "B" }, { id: "x", label: "C" }],
      items: [{ name: "Eins" }],
    });
    const first = parseConfig(raw);
    expect(first.dimensions.map((entry) => entry.id)).toEqual(["d-0", "x", "x~2"]);
    expect(first.items[0]!.id).toBe("i-0");
    expect(parseConfig(raw)).toEqual(first);
  });

  it("macht doppelte Kennungen eindeutig", () => {
    const parsed = parseConfig(
      JSON.stringify({ dimensions: [], items: [{ id: "x", name: "A" }, { id: "x", name: "B" }] }),
    );
    expect(new Set(parsed.items.map((item) => item.id)).size).toBe(2);
  });

  it("nimmt höchstens MAX_ITEMS Elemente", () => {
    const items = Array.from({ length: MAX_ITEMS + 3 }, (_, index) => ({ id: String(index), name: String(index) }));
    expect(parseConfig(JSON.stringify({ items })).items).toHaveLength(MAX_ITEMS);
  });

  it("setzt einen unbekannten Typ auf Text und eine unbekannte Farbe auf Rot", () => {
    const parsed = parseConfig(JSON.stringify({ accent: "pink", dimensions: [{ id: "d", label: "D", type: "video" }] }));
    expect(parsed.accent).toBe("red");
    expect(parsed.dimensions[0]!.type).toBe("text");
  });

  it("liest die Schalter mit ihren Vorgaben", () => {
    expect(parseConfig("{}")).toMatchObject({ highlightDifferences: true, markBest: true, differenceToggle: false, visibleRows: 5 });
    expect(parseConfig('{"visibleRows":0}').visibleRows).toBe(0);
    expect(parseConfig('{"visibleRows":-3}').visibleRows).toBe(5);
    expect(parseConfig('{"visibleRows":7.8}').visibleRows).toBe(7);
    expect(parseConfig('{"highlightDifferences":false,"markBest":false,"differenceToggle":true}')).toMatchObject({
      highlightDifferences: false,
      markBest: false,
      differenceToggle: true,
    });
  });
});

describe("serializeConfigJson", () => {
  it("lässt Vorgaben und leere Angaben weg", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "n", label: "N", type: "number", units: [{ id: "u", label: "" }], prefer: "none", hint: " " }],
      items: [{ id: "a", name: "A", subtitle: "", values: { n: 2 } }],
    };
    expect(JSON.parse(serializeConfigJson(config))).toEqual({
      heading: "",
      accent: "red",
      dimensions: [{ id: "n", label: "N", type: "number" }],
      items: [{ id: "a", name: "A", values: { n: 2 } }],
    });
  });

  it("schreibt eine b64-Payload", () => {
    const encoded = encodeConfigAttribute(sampleConfig());
    expect(encoded.startsWith("b64:")).toBe(true);
    expect(JSON.parse(decodePayload(encoded)!).heading).toBe("Modelle im Vergleich");
  });
});

describe("parseNumber", () => {
  it.each([
    ["510", 510],
    ["28,5", 28.5],
    ["1.234,5", 1234.5],
    ["1,234.5", 1234.5],
    [" -3 ", -3],
    [".5", 0.5],
    [7, 7],
  ])("liest %p als %p", (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected);
  });

  it.each(["", "abc", "1,2,3x", null, Number.NaN, Infinity])("liest %p als keine Zahl", (raw) => {
    expect(parseNumber(raw)).toBeNull();
  });
});

describe("normalizeValue", () => {
  it("behält Zeilenumbrüche im Text", () => {
    expect(normalizeValue(dim("text"), "  a\nb ")).toBe("<p>a<br>b</p>");
    expect(normalizeValue(dim("text"), '<p>x<script>alert(1)</script><b onclick="y">fett</b></p>')).toBe("<p>xfett</p>");
    expect(normalizeValue(dim("text"), '<p>A <span data-man-icon="craft/check" onclick="x"></span></p>')).toBe(
      '<p>A <span data-man-icon="craft/check" data-man-unlabeled="" role="img" aria-label="Icon" contenteditable="false"></span></p>',
    );
    expect(normalizeValue(dim("text"), "  ")).toBeUndefined();
  });

  it("filtert leere Listeneinträge", () => {
    expect(normalizeValue(dim("list"), ["a", " ", "b", 3])).toEqual(["a", "b"]);
    expect(normalizeValue(dim("list"), ["a<br>b", "<i>c</i>"])).toEqual(["a", "b", "c"]);
    expect(normalizeValue(dim("list"), [])).toBeUndefined();
  });

  it("nimmt nur bekannte Optionen", () => {
    const choice = dim("choice", { options: [{ id: "x", label: "X" }] });
    expect(normalizeValue(choice, "x")).toBe("x");
    expect(normalizeValue(choice, "y")).toBeUndefined();
  });

  it("rundet Bewertungen und begrenzt sie auf 1–5", () => {
    expect(normalizeValue(dim("rating"), 3.6)).toBe(4);
    expect(normalizeValue(dim("rating"), 0)).toBeUndefined();
    expect(normalizeValue(dim("rating"), 6)).toBeUndefined();
  });

  it("nimmt nur sichere Bildadressen", () => {
    const value = normalizeValue(dim("gallery"), [
      { url: "javascript:alert(1)", alt: "" },
      { url: "/api/media/x.jpg", alt: "ok", width: 10.2, height: -1 },
      { url: "//fremd.example/x.jpg" },
      "kaputt",
    ]);
    expect(value).toEqual([{ url: "/api/media/x.jpg", alt: "ok", width: 10 }]);
  });
});

describe("isSafeImageUrl", () => {
  it("erlaubt https, http und eigene Pfade", () => {
    expect(isSafeImageUrl("https://a.example/x.png")).toBe(true);
    expect(isSafeImageUrl("http://a.example/x.png")).toBe(true);
    expect(isSafeImageUrl("/x.png")).toBe(true);
    expect(isSafeImageUrl("data:image/png;base64,AAA")).toBe(false);
    expect(isSafeImageUrl("//a.example/x.png")).toBe(false);
    expect(isSafeImageUrl("/\\fremd.example/x.png")).toBe(false);
    expect(isSafeImageUrl("/x\n.png")).toBe(false);
  });
});

describe("Typwechsel", () => {
  it("macht aus Text eine Liste und zurück", () => {
    const text = dim("text");
    const list = dim("list");
    expect(convertValue("<p>a<br>b</p>", text, list)).toEqual(["a", "b"]);
    expect(convertValue(["a", "b"], list, text)).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  it("liest Ja/Nein aus Text und verwirft Unklares", () => {
    expect(convertValue("ja", dim("text"), dim("bool"))).toBe(true);
    expect(convertValue("Nein", dim("text"), dim("bool"))).toBe(false);
    expect(convertValue("vielleicht", dim("text"), dim("bool"))).toBeUndefined();
  });

  it("lässt Bilder nur Bilder sein", () => {
    expect(convertValue([{ url: "/x.png", alt: "" }], dim("gallery"), dim("text"))).toBeUndefined();
    expect(convertValue("x", dim("text"), dim("gallery"))).toBeUndefined();
  });

  it("macht aus Texten Optionen einer Auswahl, ohne Werte zu verlieren", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "c", label: "Kabine", type: "text" }],
      items: [
        { id: "a", name: "A", values: { c: "GX" } },
        { id: "b", name: "B", values: { c: "GM" } },
        { id: "c", name: "C", values: { c: "GX" } },
      ],
    };
    const next = changeDimensionType(config, "c", "choice");
    const options = next.dimensions[0]!.options!;
    expect(options.map((option) => option.label)).toEqual(["GX", "GM"]);
    expect(next.items.map((item) => item.values.c)).toEqual([options[0]!.id, options[1]!.id, options[0]!.id]);
  });

  it("macht aus Listen je Eintrag eine Option", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "l", label: "L", type: "list" }],
      items: [
        { id: "a", name: "A", values: { l: ["Rot", "Blau"] } },
        { id: "b", name: "B", values: { l: ["Blau"] } },
      ],
    };
    const next = changeDimensionType(config, "l", "choice");
    expect(next.dimensions[0]!.options!.map((option) => option.label)).toEqual(["Rot", "Blau"]);
  });

  it("behält Einheit und Vorzug über einen Umweg als Text", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "n", label: "N", type: "number", units: [{ id: "u", label: "PS" }], prefer: "higher" }],
      items: [],
    };
    const back = changeDimensionType(changeDimensionType(config, "n", "text"), "n", "number");
    expect(back.dimensions[0]).toMatchObject({ units: [{ id: "u", label: "PS" }], prefer: "higher" });
    expect(JSON.parse(serializeConfigJson(changeDimensionType(config, "n", "text"))).dimensions[0]).toEqual({ id: "n", label: "N", type: "text" });
  });

  it("wandelt Zahl in Text und zurück", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "n", label: "N", type: "number", units: [{ id: "u", label: "PS" }] }],
      items: [{ id: "a", name: "A", values: { n: 2.5 } }],
    };
    const asText = changeDimensionType(config, "n", "text");
    expect(asText.items[0]!.values.n).toBe("<p>2.5</p>");
    expect(changeDimensionType(asText, "n", "number").items[0]!.values.n).toBe(2.5);
  });

  it("lässt den Vergleich bei gleichem Typ oder unbekannter Dimension unberührt", () => {
    const config = sampleConfig();
    expect(changeDimensionType(config, "power", "number")).toBe(config);
    expect(changeDimensionType(config, "weg", "text")).toBe(config);
  });
});

describe("Icons", () => {
  it("liest Icons von Dimension, Element und Ja/Nein, verwirft Unbekanntes und Vorgaben", () => {
    const parsed = parseConfig(
      JSON.stringify({
        dimensions: [
          { id: "b", label: "B", type: "bool", icon: "craft/truck-check", yesIcon: "man/checkmark", noIcon: "craft/minus" },
          { id: "t", label: "T", type: "text", icon: "gibt/es-nicht", yesIcon: "craft/check" },
        ],
        items: [{ id: "a", name: "A", icon: "craft/check" }],
      }),
    );
    expect(parsed.dimensions[0]).toEqual({ id: "b", label: "B", type: "bool", icon: "craft/truck-check", noIcon: "craft/minus" });
    expect(parsed.dimensions[1]).toEqual({ id: "t", label: "T", type: "text" });
    expect(parsed.items[0]!.icon).toBe("craft/check");
    expect(parseConfig(encodeConfigAttribute(parsed))).toEqual(parsed);
  });

  it("nennt alle gezeigten Icons einmal, Ja/Nein mit Vorgaben", () => {
    const config: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: [{ id: "b", label: "B", type: "bool", icon: "craft/check" }],
      items: [{ id: "a", name: "A", icon: "craft/check", values: {} }],
    };
    expect(usedIconIds(config)).toEqual(["craft/check", DEFAULT_YES_ICON, DEFAULT_NO_ICON]);
  });
});

describe("duplicateDimension", () => {
  it("setzt eine Kopie mit Werten direkt dahinter", () => {
    const { config, id } = duplicateDimension(sampleConfig(), "power");
    expect(id).toBeDefined();
    const at = config.dimensions.findIndex((dimension) => dimension.id === id);
    expect(config.dimensions[at - 1]!.id).toBe("power");
    expect(config.dimensions[at]).toMatchObject({ label: "Leistung (Kopie)", type: "number", units: [{ id: "ps", label: "PS" }], prefer: "higher" });
    expect(config.items.map((item) => item.values[id!])).toEqual([510, 470]);
  });

  it("bleibt an der Höchstzahl und bei unbekannter Dimension unverändert", () => {
    const full: ComparisonConfig = {
      ...emptyConfig(),
      dimensions: Array.from({ length: MAX_DIMENSIONS }, (_, index) => ({ id: `d${index}`, label: "D", type: "text" as const })),
    };
    expect(duplicateDimension(full, "d0")).toEqual({ config: full });
    const config = sampleConfig();
    expect(duplicateDimension(config, "weg").config).toBe(config);
  });
});

describe("Einheiten einer Zahl", () => {
  const two: Dimension = {
    id: "p",
    label: "Leistung",
    type: "number",
    units: [
      { id: "ps", label: "PS" },
      { id: "kw", label: "kW" },
    ],
  };

  it("liest die alte einzelne Einheit als Liste", () => {
    const parsed = parseConfig('{"dimensions":[{"id":"p","label":"L","type":"number","unit":"PS"}]}');
    expect(parsed.dimensions[0]!.units).toEqual([{ id: "u-0", label: "PS" }]);
    expect(JSON.parse(serializeConfigJson(parsed)).dimensions[0]).toEqual({ id: "p", label: "L", type: "number", units: [{ id: "u-0", label: "PS" }] });
  });

  it("führt ab zwei Einheiten je Einheit eine Zahl", () => {
    expect(normalizeValue(two, { ps: "510", kw: 375, weg: 1 })).toEqual({ ps: 510, kw: 375 });
    expect(normalizeValue(two, 510)).toEqual({ ps: 510 });
    expect(normalizeValue(two, { ps: "x" })).toBeUndefined();
  });

  it("behält mit nur noch einer Einheit deren Zahl", () => {
    const one: Dimension = { ...two, units: [{ id: "kw", label: "kW" }] };
    expect(normalizeValue(one, { ps: 510, kw: 375 })).toBe(375);
  });

  it("schreibt beim Wechsel zu Text alle Einheiten", () => {
    const config: ComparisonConfig = { ...emptyConfig(), dimensions: [two], items: [{ id: "a", name: "A", values: { p: { ps: 510, kw: 375 } } }] };
    expect(changeDimensionType(config, "p", "text").items[0]!.values.p).toBe("<p>510 PS / 375 kW</p>");
  });
});

describe("Größe der Ja/Nein-Zeichen", () => {
  it("liest kleiner/größer, lässt Normal und Unbekanntes weg", () => {
    const parsed = parseConfig(
      JSON.stringify({
        dimensions: [
          { id: "a", label: "A", type: "bool", markSize: "large" },
          { id: "b", label: "B", type: "bool", markSize: "normal" },
          { id: "c", label: "C", type: "bool", markSize: "riesig" },
          { id: "d", label: "D", type: "text", markSize: "small" },
        ],
      }),
    );
    expect(parsed.dimensions.map((dimension) => dimension.markSize)).toEqual(["large", undefined, undefined, undefined]);
    expect(JSON.parse(serializeConfigJson({ ...parsed, dimensions: [{ id: "x", label: "X", type: "bool", markSize: "normal" }] })).dimensions[0]).toEqual({
      id: "x",
      label: "X",
      type: "bool",
    });
  });
});

describe("Farben für Ja/Nein", () => {
  it("liest, normalisiert und schreibt eigene Farben nur bei Ja/Nein", () => {
    const parsed = parseConfig(
      JSON.stringify({
        dimensions: [
          { id: "b", label: "B", type: "bool", yesColor: "#2D6300", noColor: "f00" },
          { id: "t", label: "T", type: "text", yesColor: "#123456" },
          { id: "x", label: "X", type: "bool", yesColor: "rot" },
        ],
      }),
    );
    expect(parsed.dimensions.map((dimension) => [dimension.yesColor, dimension.noColor])).toEqual([
      ["#2d6300", "#ff0000"],
      [undefined, undefined],
      [undefined, undefined],
    ]);
    expect(parseConfig(encodeConfigAttribute(parsed))).toEqual(parsed);
    expect(usedColors(parsed)).toEqual(["#2d6300", "#ff0000"]);
  });
});

describe("setItemValue", () => {
  it("setzt und löscht einen Wert, ohne das Element zu verändern", () => {
    const item = { id: "a", name: "A", values: { x: 1 } };
    expect(setItemValue(item, "y", 2).values).toEqual({ x: 1, y: 2 });
    expect(setItemValue(item, "x", undefined).values).toEqual({});
    expect(item.values).toEqual({ x: 1 });
  });
});

describe("hasContent", () => {
  it("braucht Elemente und Dimensionen", () => {
    expect(hasContent(emptyConfig())).toBe(false);
    expect(hasContent({ ...emptyConfig(), items: [{ id: "a", name: "A", values: {} }] })).toBe(false);
    expect(hasContent(sampleConfig())).toBe(true);
  });
});
