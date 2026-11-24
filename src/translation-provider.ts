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

/**
 * Wie die Texte des Vergleichs durch Staffbases Inhaltsübersetzung reisen.
 *
 * Der Dienst übersetzt Textknoten, keine Attribute. Der Vergleich schickt
 * deshalb ein kleines Dokument, in dem jeder Text ein eigener Knoten ist und
 * seinen Schlüssel in einem Attribut trägt — wie die USP-Box. Fließtext und
 * Listeneinträge reisen als Markup (`div`, samt Icons) und werden beim
 * Zurücklesen wieder bereinigt; alles andere als reiner Text (`p`). Zahlen,
 * Ja/Nein, Bewertungen, Bildadressen und die Reihenfolge bleiben Zeichen für
 * Zeichen.
 */

import { TranslationProvider } from "@shared/translation/carriers";

import { COMPARISON_WIDGET_TAG } from "./comparison";
import { CONFIG_ATTRIBUTE } from "./configuration-schema";
import { CellValue, ComparisonConfig, GalleryImage, encodeConfigAttribute, parseConfig } from "./comparison-model";
import { richEntries, sanitizeTextValue } from "./rich-values";

export const FIELD_ATTRIBUTE = "data-mhp-cmp-field";

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Field {
  key: string;
  text: string;
  /** Bereinigtes Markup statt Text (Fließtext, Listeneintrag). */
  markup?: boolean;
}

/** Alle übersetzbaren Texte in Lesereihenfolge, mit Schlüssel aus Kennungen. */
export function configFields(config: ComparisonConfig): Field[] {
  const fields: Field[] = [];
  const add = (key: string, text: string | undefined, markup = false): void => {
    if (text !== undefined && text.trim() !== "") fields.push(markup ? { key, text, markup } : { key, text });
  };
  add("heading", config.heading);
  config.dimensions.forEach((dimension) => {
    add(`d:${dimension.id}:label`, dimension.label);
    add(`d:${dimension.id}:hint`, dimension.hint);
    if (dimension.type === "number") add(`d:${dimension.id}:unit`, dimension.unit);
    dimension.options?.forEach((option) => add(`d:${dimension.id}:o:${option.id}`, option.label));
  });
  config.items.forEach((item) => {
    add(`i:${item.id}:name`, item.name);
    add(`i:${item.id}:subtitle`, item.subtitle);
    config.dimensions.forEach((dimension) => {
      const value = item.values[dimension.id];
      const key = `i:${item.id}:v:${dimension.id}`;
      if (dimension.type === "text" && typeof value === "string") add(key, sanitizeTextValue(value), true);
      if (dimension.type === "list") (value as string[] | undefined)?.forEach((entry, index) => add(`${key}:${index}`, entry, true));
      if (dimension.type === "gallery") (value as GalleryImage[] | undefined)?.forEach((image, index) => add(`${key}:${index}`, image.alt));
    });
  });
  return fields;
}

export function readTranslatedFields(html: string): Map<string, string> {
  const fields = new Map<string, string>();
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.body.querySelectorAll(`[${FIELD_ATTRIBUTE}]`).forEach((element) => {
    const key = element.getAttribute(FIELD_ATTRIBUTE);
    if (key === null || fields.has(key)) return;
    // Markup kommt als Markup zurück und wird von `translateValue` bereinigt.
    fields.set(key, element.tagName === "DIV" ? element.innerHTML : (element.textContent ?? ""));
  });
  return fields;
}

/** Leer heißt verloren, nicht übersetzt — dann bleibt die Quellsprache. */
const pick = (fields: ReadonlyMap<string, string>, key: string, source: string): string => {
  const translated = fields.get(key)?.trim();
  return translated === undefined || translated === "" ? source : translated;
};

const pickOptional = (fields: ReadonlyMap<string, string>, key: string, source: string | undefined): { value?: string } =>
  source === undefined ? {} : { value: pick(fields, key, source) };

function translateValue(value: CellValue, type: string, key: string, fields: ReadonlyMap<string, string>): CellValue {
  if (type === "text" && typeof value === "string") {
    const translated = sanitizeTextValue(fields.get(key) ?? "");
    return translated === "" ? value : translated;
  }
  if (type === "list" && Array.isArray(value)) {
    return (value as string[]).map((entry, index) => richEntries(fields.get(`${key}:${index}`) ?? "")[0] ?? entry);
  }
  if (type === "gallery" && Array.isArray(value)) {
    return (value as GalleryImage[]).map((image, index) => ({ ...image, alt: image.alt === "" ? "" : pick(fields, `${key}:${index}`, image.alt) }));
  }
  return value;
}

export function applyTranslatedFields(config: ComparisonConfig, fields: ReadonlyMap<string, string>): ComparisonConfig {
  const types = new Map(config.dimensions.map((dimension) => [dimension.id, dimension.type]));
  return {
    ...config,
    heading: pick(fields, "heading", config.heading),
    dimensions: config.dimensions.map((dimension) => {
      const hint = pickOptional(fields, `d:${dimension.id}:hint`, dimension.hint).value;
      const unit = dimension.type === "number" ? pickOptional(fields, `d:${dimension.id}:unit`, dimension.unit).value : dimension.unit;
      return {
        ...dimension,
        label: pick(fields, `d:${dimension.id}:label`, dimension.label),
        ...(hint === undefined ? {} : { hint }),
        ...(unit === undefined ? {} : { unit }),
        ...(dimension.options === undefined
          ? {}
          : { options: dimension.options.map((option) => ({ ...option, label: pick(fields, `d:${dimension.id}:o:${option.id}`, option.label) })) }),
      };
    }),
    items: config.items.map((item) => {
      const subtitle = pickOptional(fields, `i:${item.id}:subtitle`, item.subtitle).value;
      const values = Object.fromEntries(
        Object.entries(item.values).map(([id, value]) => [id, translateValue(value, types.get(id) ?? "", `i:${item.id}:v:${id}`, fields)]),
      );
      return {
        ...item,
        name: pick(fields, `i:${item.id}:name`, item.name),
        ...(subtitle === undefined ? {} : { subtitle }),
        values,
      };
    }),
  };
}

export const comparisonTranslationProvider: TranslationProvider = {
  id: `${COMPARISON_WIDGET_TAG}/${CONFIG_ATTRIBUTE}`,
  label: "Datenvergleich",
  ref: { tagName: COMPARISON_WIDGET_TAG, attribute: CONFIG_ATTRIBUTE },

  toTranslatable: (stored) => {
    const fields = configFields(parseConfig(stored));
    if (fields.length === 0) return null;
    // Absätze: Listeneinträge und Texte bleiben je ein eigener Knoten.
    const nodes = fields
      .map(({ key, text, markup }) =>
        markup === true
          ? `<div ${FIELD_ATTRIBUTE}="${escapeHtml(key)}">${text}</div>`
          : `<p ${FIELD_ATTRIBUTE}="${escapeHtml(key)}">${escapeHtml(text)}</p>`,
      )
      .join("");
    return `<div>${nodes}</div>`;
  },

  acceptsTranslated: (html) => html.includes(FIELD_ATTRIBUTE),

  fromTranslated: (html, stored) => {
    const config = parseConfig(stored);
    if (configFields(config).length === 0) return null;
    return encodeConfigAttribute(applyTranslatedFields(config, readTranslatedFields(html)));
  },
};
