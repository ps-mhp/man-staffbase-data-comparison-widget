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
 * Was der Datenvergleich zeigt und wie es im einen Attribut steht.
 *
 * Ein Satz Dimensionen (die Zeilen) und je verglichenem Element eine Spalte.
 * Jedes Element trägt zu jeder Dimension einen Wert, dessen Form der Typ der
 * Dimension bestimmt. Alles in einem Attribut, als `b64:`-Payload — wie bei
 * der USP-Box: Staffbases Dialog macht Auswahlfelder nicht lesbar, und seine
 * Übersetzung gibt Attributwerte unmaskiert aus.
 *
 * Frei von DOM und React.
 */

import { normalizeHexColor } from "@man/config-ui/toolbar/colors";
import { iconIdsIn } from "@shared/icons/icon-css";
import { normalizeIconId } from "@shared/icons/icon-id";
import { decodePayload, encodePayload, isPayload } from "@shared/payload";

import { entriesToHtml, plainOf, richEntries, sanitizeTextValue } from "./rich-values";

/**
 * Die Typen einer Dimension:
 *  - `text`: Fließtext mit Absätzen, Aufzählungen und Icons (bereinigtes Markup),
 *  - `number`: Zahl mit optionaler Einheit; auf Wunsch wird der Bestwert markiert,
 *  - `bool`: Ja/Nein (Haken oder Kreuz),
 *  - `list`: mehrere Einträge als Aufzählung, je Eintrag Text und Icons,
 *  - `choice`: ein Wert aus festen Optionen der Dimension,
 *  - `rating`: Bewertung 1–5 Sterne,
 *  - `gallery`: Bilder zum Durchblättern — vergleicht nichts.
 */
export type DimensionType = "text" | "number" | "bool" | "list" | "choice" | "rating" | "gallery";

export const DIMENSION_TYPES: readonly DimensionType[] = ["text", "number", "bool", "list", "choice", "rating", "gallery"];

/** Welche Zahl gewinnt, wenn der Bestwert markiert wird. */
export type NumberPreference = "none" | "higher" | "lower";

export const NUMBER_PREFERENCES: readonly NumberPreference[] = ["none", "higher", "lower"];

/** Größe der Ja/Nein-Zeichen: Schriftgröße 16/20/24 px, das Zeichen ist .5em groß (8/10/12 px). */
export type MarkSize = "small" | "normal" | "large";

export const MARK_SIZES: readonly MarkSize[] = ["small", "normal", "large"];

export const MARK_SIZE_PX: Readonly<Record<MarkSize, number>> = { small: 16, normal: 20, large: 24 };

/** Die Akzentfarbe im Rahmen der MAN-CI, wie bei der USP-Box. */
export type ComparisonAccent = "red" | "grey" | "blue";

export const COMPARISON_ACCENTS: readonly ComparisonAccent[] = ["red", "grey", "blue"];

/** Mehr Spalten liest niemand mehr nebeneinander, auch nicht mit Scrollen. */
export const MAX_ITEMS = 12;

/** Grenze gegen versehentlich riesige Attribute. */
export const MAX_DIMENSIONS = 60;

/** Grenze je Galerie; mehr blättert niemand durch. */
export const MAX_GALLERY_IMAGES = 20;

export const MAX_RATING = 5;

/** Zeilen, die zu sehen sind, bevor der Rest hinter „Weitere … einblenden“ verschwindet – wie in der Tabelle. */
export const DEFAULT_VISIBLE_ROWS = 5;

/** Eine gespeicherte Grenze lesen; `0` heißt „nie einklappen“, Unbrauchbares die Vorgabe. */
export function clampVisibleRows(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return DEFAULT_VISIBLE_ROWS;
  return Math.floor(value);
}

/** Grenze für Optionen, die ein Typwechsel aus vorhandenen Werten bildet. */
export const MAX_CHOICE_OPTIONS = 40;

/** Die Zeichen für Ja und Nein, wenn eine Dimension keine eigenen wählt (IDs der Icon-Bibliothek). */
export const DEFAULT_YES_ICON = "man/checkmark";
export const DEFAULT_NO_ICON = "man/close";

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface Dimension {
  /** Stabil über Umsortieren und Umbenennen hinweg; daran hängen die Werte. */
  id: string;
  label: string;
  type: DimensionType;
  /** Eine kurze Erläuterung unter dem Namen. */
  hint?: string;
  /** Icon vor dem Namen (ID der Icon-Bibliothek `@shared/icons`). */
  icon?: string;
  /** `bool`: Zeichen für Ja; Vorgabe {@link DEFAULT_YES_ICON}. */
  yesIcon?: string;
  /** `bool`: Zeichen für Nein; Vorgabe {@link DEFAULT_NO_ICON}. */
  noIcon?: string;
  /** `bool`: Farbe für Ja (`#rrggbb`); Vorgabe die Akzentfarbe. */
  yesColor?: string;
  /** `bool`: Farbe für Nein (`#rrggbb`); Vorgabe gedämpftes Grau. */
  noColor?: string;
  /** `bool`: Größe der Zeichen; Vorgabe `normal` (.5em von 20 px = 10 × 10 px). */
  markSize?: MarkSize;
  /**
   * `number`: die Einheiten, z. B. „PS“ und „kW“. Je Einheit ein Wert am
   * Element; der Bestwert vergleicht die erste. Ältere Fassungen speichern
   * eine einzelne `unit` – der Parser liest sie als eine Einheit.
   */
  units?: NumberUnit[];
  /** `number`: welche Zahl der Bestwert ist; Vorgabe `none`. */
  prefer?: NumberPreference;
  /** `choice`: die erlaubten Werte. */
  options?: ChoiceOption[];
}

export interface NumberUnit {
  /** Stabil über Umbenennen und Umsortieren; daran hängen die Werte. */
  id: string;
  label: string;
}

/** Zahlen je Einheit (Kennung der Einheit → Wert), wenn eine Dimension mehrere Einheiten hat. */
export type NumberValues = Record<string, number>;

export interface GalleryImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Ein Wert in der Form, die der Typ der Dimension verlangt. */
export type CellValue = string | number | boolean | string[] | GalleryImage[] | NumberValues;

/** Die Einheiten einer Zahl-Dimension (leer, wenn keine). */
export const unitsOf = (dimension: Dimension): readonly NumberUnit[] => (dimension.type === "number" ? (dimension.units ?? []) : []);

/** Ob eine Zahl-Dimension je Einheit einen eigenen Wert führt (ab zwei Einheiten). */
export const hasUnitValues = (dimension: Dimension): boolean => unitsOf(dimension).length >= 2;

/**
 * Die Zahl, an der Bestwerte gemessen werden: bei mehreren Einheiten die der
 * ersten, sonst die Zahl selbst; `null` ohne Angabe.
 */
export function primaryNumber(value: CellValue | undefined, dimension: Dimension): number | null {
  if (typeof value === "number") return value;
  if (value === undefined || typeof value !== "object" || Array.isArray(value)) return null;
  const first = unitsOf(dimension)[0];
  const number = first === undefined ? undefined : (value as NumberValues)[first.id];
  return typeof number === "number" ? number : null;
}

export interface ComparisonItem {
  /** Stabil über Umsortieren hinweg — React-Key im Editor. */
  id: string;
  /** Der Spaltenkopf, z. B. „TGX 18.510“. */
  name: string;
  /** Eine Zeile unter dem Namen, z. B. „Fernverkehr“. */
  subtitle?: string;
  /** Icon über dem Namen (ID der Icon-Bibliothek `@shared/icons`). */
  icon?: string;
  /** Je Kennung einer Dimension ein Wert; fehlt er, steht „keine Angabe“. */
  values: Record<string, CellValue>;
}

export interface ComparisonConfig {
  heading: string;
  accent: ComparisonAccent;
  /** Zeilen ohne Unterschied abblenden, damit die Unterschiede hervortreten. Vorgabe `true`. */
  highlightDifferences: boolean;
  /** Bei Zahlen mit Vorzug und Bewertungen den besten Wert markieren. Vorgabe `true`. */
  markBest: boolean;
  /** Leser:innen bekommen einen Schalter „Nur Unterschiede“. Vorgabe `false`. */
  differenceToggle: boolean;
  /** Sichtbare Zeilen, danach „Weitere … einblenden“; `0` zeigt alle. Vorgabe {@link DEFAULT_VISIBLE_ROWS}. */
  visibleRows: number;
  dimensions: Dimension[];
  items: ComparisonItem[];
}

export const emptyConfig = (): ComparisonConfig => ({
  heading: "",
  accent: "red",
  highlightDifferences: true,
  markBest: true,
  differenceToggle: false,
  visibleRows: DEFAULT_VISIBLE_ROWS,
  dimensions: [],
  items: [],
});

/** Wie in der USP-Box: auch ohne `crypto.randomUUID` (unsicherer Kontext). */
export function newId(): string {
  const uuid = globalThis.crypto?.randomUUID;
  if (typeof uuid === "function") return uuid.call(globalThis.crypto);
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const emptyItem = (): ComparisonItem => ({ id: newId(), name: "", values: {} });

export const emptyDimension = (type: DimensionType = "text"): Dimension =>
  type === "choice" ? { id: newId(), label: "", type, options: [] } : { id: newId(), label: "", type };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asPositiveInt = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

/** Nur `https:`, `http:` und Pfade der eigenen Seite — kein `javascript:` im `src`. */
export function isSafeImageUrl(url: string): boolean {
  // Ein Backslash gilt Browsern als Schrägstrich: „/\\fremd.example“ wäre protokollrelativ.
  if (url.includes("\\") || [...url].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f)) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return /^https?:\/\//i.test(url);
}

function parseImage(value: unknown): GalleryImage | null {
  if (!isRecord(value)) return null;
  const url = asText(value.url);
  if (url === "" || !isSafeImageUrl(url)) return null;
  const image: GalleryImage = { url, alt: asText(value.alt) };
  const width = asPositiveInt(value.width);
  const height = asPositiveInt(value.height);
  if (width !== undefined) image.width = width;
  if (height !== undefined) image.height = height;
  return image;
}

/** Eine Zahl aus Zahl oder Text; Komma als Dezimalzeichen geht auch. */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s/g, "");
  if (text === "") return null;
  // „1.234,5“ und „1,234.5“: das letzte Trennzeichen ist das Dezimalzeichen.
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const normalized =
    lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

/**
 * Bringt einen rohen Wert in die Form des Typs; `undefined` heißt „keine
 * Angabe“. Was nicht passt, fällt weg statt die Zelle zu zerreißen.
 */
export function normalizeValue(dimension: Dimension, raw: unknown): CellValue | undefined {
  switch (dimension.type) {
    case "text": {
      // Immer bereinigt: was hier steht, rendert die Seite als Markup.
      const html = typeof raw === "string" ? sanitizeTextValue(raw) : "";
      return html === "" ? undefined : html;
    }
    case "number": {
      const units = unitsOf(dimension);
      if (units.length >= 2) {
        // Je Einheit eine Zahl; eine einzelne Zahl (vor der zweiten Einheit) gilt der ersten.
        const values: NumberValues = {};
        if (isRecord(raw)) {
          for (const unit of units) {
            const number = parseNumber(raw[unit.id]);
            if (number !== null) values[unit.id] = number;
          }
        } else {
          const number = parseNumber(raw);
          if (number !== null) values[units[0]!.id] = number;
        }
        return Object.keys(values).length === 0 ? undefined : values;
      }
      // Eine oder keine Einheit: eine Zahl; bleibt nur die erste von mehreren Einheiten übrig, deren Wert.
      if (isRecord(raw)) {
        const first = units[0] === undefined ? undefined : raw[units[0].id];
        return parseNumber(first ?? Object.values(raw)[0]) ?? undefined;
      }
      return parseNumber(raw) ?? undefined;
    }
    case "bool":
      return typeof raw === "boolean" ? raw : undefined;
    case "list": {
      // Jeder Eintrag bereinigt; ein Eintrag mit Zeilen wird zu mehreren.
      const list = Array.isArray(raw) ? raw.flatMap((entry) => (typeof entry === "string" ? richEntries(entry) : [])) : [];
      return list.length === 0 ? undefined : list;
    }
    case "choice": {
      const id = asText(raw);
      return dimension.options?.some((option) => option.id === id) === true ? id : undefined;
    }
    case "rating": {
      const rating = parseNumber(raw);
      if (rating === null) return undefined;
      const rounded = Math.round(rating);
      return rounded >= 1 && rounded <= MAX_RATING ? rounded : undefined;
    }
    case "gallery": {
      const images = Array.isArray(raw) ? raw.flatMap((entry) => parseImage(entry) ?? []) : [];
      return images.length === 0 ? undefined : images.slice(0, MAX_GALLERY_IMAGES);
    }
  }
}

/**
 * Fehlende Kennungen werden aus der Stelle abgeleitet, nicht gewürfelt: die
 * Übersetzung liest das Attribut zweimal und muss beide Male dieselben
 * Schlüssel finden — auch bei von Hand geschriebenem JSON.
 */
const idOr = (value: unknown, fallback: string): string => asText(value) || fallback;

function parseOptions(raw: unknown): ChoiceOption[] {
  if (!Array.isArray(raw)) return [];
  const used = new Set<string>();
  return raw.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const label = asText(entry.label);
    const id = idOr(entry.id, `o-${index}`);
    if (used.has(id)) return [];
    used.add(id);
    return [{ id, label }];
  });
}

/** Die Einheiten: `units` (Liste) oder, aus älteren Fassungen, die eine `unit`. */
function parseUnits(raw: unknown, legacy: unknown): NumberUnit[] {
  if (!Array.isArray(raw)) {
    const label = asText(legacy);
    return label === "" ? [] : [{ id: "u-0", label }];
  }
  const used = new Set<string>();
  return raw.flatMap((entry, index) => {
    const unit = typeof entry === "string" ? { id: `u-${index}`, label: entry.trim() } : isRecord(entry) ? { id: idOr(entry.id, `u-${index}`), label: asText(entry.label) } : null;
    if (unit === null || used.has(unit.id)) return [];
    used.add(unit.id);
    return [unit];
  });
}

function parseDimension(raw: unknown, index: number): Dimension | null {
  if (!isRecord(raw)) return null;
  const type = DIMENSION_TYPES.includes(raw.type as DimensionType) ? (raw.type as DimensionType) : "text";
  const dimension: Dimension = { id: idOr(raw.id, `d-${index}`), label: asText(raw.label), type };
  const hint = asText(raw.hint);
  if (hint !== "") dimension.hint = hint;
  // Unbekannte Icons fallen weg: ein Zeichen ohne Zeichnung wäre eine Lücke.
  const icon = normalizeIconId(asText(raw.icon));
  if (icon !== null) dimension.icon = icon;
  if (type === "bool") {
    const yesIcon = normalizeIconId(asText(raw.yesIcon));
    const noIcon = normalizeIconId(asText(raw.noIcon));
    if (yesIcon !== null && yesIcon !== DEFAULT_YES_ICON) dimension.yesIcon = yesIcon;
    if (noIcon !== null && noIcon !== DEFAULT_NO_ICON) dimension.noIcon = noIcon;
    const yesColor = normalizeHexColor(asText(raw.yesColor));
    const noColor = normalizeHexColor(asText(raw.noColor));
    if (yesColor !== null) dimension.yesColor = yesColor;
    if (noColor !== null) dimension.noColor = noColor;
    if (raw.markSize === "small" || raw.markSize === "large") dimension.markSize = raw.markSize;
  }
  if (type === "number") {
    const units = parseUnits(raw.units, raw.unit);
    if (units.length > 0) dimension.units = units;
    if (raw.prefer === "higher" || raw.prefer === "lower") dimension.prefer = raw.prefer;
  }
  if (type === "choice") dimension.options = parseOptions(raw.options);
  return dimension;
}

function parseItem(raw: unknown, index: number, dimensions: readonly Dimension[]): ComparisonItem | null {
  if (!isRecord(raw)) return null;
  const item: ComparisonItem = { id: idOr(raw.id, `i-${index}`), name: asText(raw.name), values: {} };
  const subtitle = asText(raw.subtitle);
  if (subtitle !== "") item.subtitle = subtitle;
  const icon = normalizeIconId(asText(raw.icon));
  if (icon !== null) item.icon = icon;
  const values = isRecord(raw.values) ? raw.values : {};
  for (const dimension of dimensions) {
    const value = normalizeValue(dimension, values[dimension.id]);
    if (value !== undefined) item.values[dimension.id] = value;
  }
  return item;
}

/**
 * Doppelte Kennungen ließen React Einträge verwechseln und Werte vertauschen.
 * Der Ersatz hängt die Stelle an — wieder ableitbar, nicht gewürfelt.
 */
function uniqueIds<T extends { id: string }>(entries: T[]): T[] {
  const used = new Set<string>();
  return entries.map((entry, index) => {
    let id = entry.id;
    for (let round = 0; used.has(id); round += 1) id = `${entry.id}~${index}${round === 0 ? "" : `-${round}`}`;
    used.add(id);
    return id === entry.id ? entry : { ...entry, id };
  });
}

/** Liest das JSON *im* Attribut. Alles Unlesbare ergibt den leeren Vergleich. */
export function parseConfigJson(json: string): ComparisonConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return emptyConfig();
  }
  if (!isRecord(parsed)) return emptyConfig();

  const base = emptyConfig();
  const dimensions = uniqueIds(
    (Array.isArray(parsed.dimensions) ? parsed.dimensions : [])
      .flatMap((entry, index) => parseDimension(entry, index) ?? [])
      .slice(0, MAX_DIMENSIONS),
  );
  const items = uniqueIds(
    (Array.isArray(parsed.items) ? parsed.items : [])
      .flatMap((entry, index) => parseItem(entry, index, dimensions) ?? [])
      .slice(0, MAX_ITEMS),
  );
  return {
    heading: asText(parsed.heading),
    accent: COMPARISON_ACCENTS.includes(parsed.accent as ComparisonAccent) ? (parsed.accent as ComparisonAccent) : base.accent,
    highlightDifferences: parsed.highlightDifferences !== false,
    markBest: parsed.markBest !== false,
    differenceToggle: parsed.differenceToggle === true,
    visibleRows: parsed.visibleRows === undefined ? DEFAULT_VISIBLE_ROWS : clampVisibleRows(parsed.visibleRows),
    dimensions,
    items,
  };
}

/**
 * Liest das Attribut: `b64:`-Payload (was der Editor schreibt) oder rohes
 * JSON (von Hand gesetzt). Wirft nie — ein kaputter Vergleich darf die Seite
 * nicht mitreißen.
 */
export function parseConfig(raw: unknown): ComparisonConfig {
  if (typeof raw !== "string" || raw.trim() === "") return emptyConfig();
  if (isPayload(raw)) {
    const decoded = decodePayload(raw);
    return decoded === null ? emptyConfig() : parseConfigJson(decoded);
  }
  return parseConfigJson(raw);
}

function serializeDimension(dimension: Dimension): Record<string, unknown> {
  const out: Record<string, unknown> = { id: dimension.id, label: dimension.label, type: dimension.type };
  if (dimension.hint !== undefined && dimension.hint.trim() !== "") out.hint = dimension.hint;
  if (dimension.icon !== undefined) out.icon = dimension.icon;
  if (dimension.type === "bool") {
    if (dimension.yesIcon !== undefined && dimension.yesIcon !== DEFAULT_YES_ICON) out.yesIcon = dimension.yesIcon;
    if (dimension.noIcon !== undefined && dimension.noIcon !== DEFAULT_NO_ICON) out.noIcon = dimension.noIcon;
    const yesColor = normalizeHexColor(dimension.yesColor);
    const noColor = normalizeHexColor(dimension.noColor);
    if (yesColor !== null) out.yesColor = yesColor;
    if (noColor !== null) out.noColor = noColor;
    if (dimension.markSize !== undefined && dimension.markSize !== "normal") out.markSize = dimension.markSize;
  }
  if (dimension.type === "number") {
    const units = (dimension.units ?? []).filter((unit, _, all) => all.length > 1 || unit.label.trim() !== "");
    if (units.length > 0) out.units = units.map(({ id, label }) => ({ id, label }));
    if (dimension.prefer !== undefined && dimension.prefer !== "none") out.prefer = dimension.prefer;
  }
  if (dimension.type === "choice") out.options = (dimension.options ?? []).map(({ id, label }) => ({ id, label }));
  return out;
}

function serializeItem(item: ComparisonItem, dimensions: readonly Dimension[]): Record<string, unknown> {
  const values: Record<string, CellValue> = {};
  for (const dimension of dimensions) {
    // Werte gelöschter Dimensionen und solche in falscher Form fallen hier weg.
    const value = normalizeValue(dimension, item.values[dimension.id]);
    if (value !== undefined) values[dimension.id] = value;
  }
  const out: Record<string, unknown> = { id: item.id, name: item.name };
  if (item.subtitle !== undefined && item.subtitle.trim() !== "") out.subtitle = item.subtitle;
  if (item.icon !== undefined) out.icon = item.icon;
  out.values = values;
  return out;
}

/** Das JSON, Vorgaben weggelassen. */
export function serializeConfigJson(config: ComparisonConfig): string {
  const out: Record<string, unknown> = { heading: config.heading, accent: config.accent };
  if (!config.highlightDifferences) out.highlightDifferences = false;
  if (!config.markBest) out.markBest = false;
  if (config.differenceToggle) out.differenceToggle = true;
  if (config.visibleRows !== DEFAULT_VISIBLE_ROWS) out.visibleRows = config.visibleRows;
  out.dimensions = config.dimensions.map(serializeDimension);
  out.items = config.items.map((item) => serializeItem(item, config.dimensions));
  return JSON.stringify(out);
}

export function encodeConfigAttribute(config: ComparisonConfig): string {
  return encodePayload(serializeConfigJson(config));
}

/** Ob der Vergleich etwas zu zeigen hat: mindestens ein Element und eine Dimension. */
export const hasContent = (config: ComparisonConfig): boolean => config.items.length > 0 && config.dimensions.length > 0;

/** Ein Wert als reiner Text (Zeilen getrennt), als Ausgang für einen Typwechsel. */
function valueAsText(value: CellValue | undefined, from: Dimension): string | undefined {
  if (value === undefined) return undefined;
  if (from.type === "gallery") return undefined;
  if (from.type === "text") return plainOf(value as string);
  if (from.type === "number" && typeof value === "object" && !Array.isArray(value)) {
    // „510 PS / 375 kW“ – alle Einheiten, damit beim Wechsel zu Text nichts verloren geht.
    const values = value as NumberValues;
    return unitsOf(from)
      .filter((unit) => values[unit.id] !== undefined)
      .map((unit) => `${values[unit.id]} ${unit.label}`.trim())
      .join(" / ");
  }
  if (from.type === "list") return (value as string[]).map(plainOf).join("\n");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (from.type === "choice") return from.options?.find((option) => option.id === value)?.label;
  return String(value);
}

const escapeHtml = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Wandelt einen Wert beim Typwechsel einer Dimension, so weit es Sinn ergibt:
 * Text ↔ Liste (je Zeile ein Eintrag), Text/Zahl ↔ Bewertung, Auswahl → Text.
 * Was sich nicht wandeln lässt, fällt weg. Bilder bleiben nur Bilder.
 */
export function convertValue(value: CellValue | undefined, from: Dimension, to: Dimension): CellValue | undefined {
  if (value === undefined) return undefined;
  if (from.type === to.type) return normalizeValue(to, value);
  if (from.type === "gallery" || to.type === "gallery") return undefined;
  // Zwischen Text und Liste bleiben Icons und Auszeichnung erhalten.
  if (from.type === "text" && to.type === "list") return normalizeValue(to, richEntries(value as string));
  if (from.type === "list" && to.type === "text") return normalizeValue(to, entriesToHtml(value as string[]));
  const text = valueAsText(value, from);
  if (text === undefined) return undefined;
  switch (to.type) {
    case "text":
      return normalizeValue(to, escapeHtml(text).replace(/\n/g, "<br>"));
    case "list":
      return normalizeValue(to, text.split("\n").map(escapeHtml));
    case "bool":
      return /^(ja|yes|true|1|x|✓)$/i.test(text.trim()) ? true : /^(nein|no|false|0|-|–)$/i.test(text.trim()) ? false : undefined;
    case "choice": {
      const match = to.options?.find((option) => option.label.toLowerCase() === text.trim().toLowerCase());
      return match?.id;
    }
    default:
      return normalizeValue(to, text);
  }
}

/** Setzt den Typ einer Dimension und wandelt die Werte aller Elemente mit. */
export function changeDimensionType(config: ComparisonConfig, dimensionId: string, type: DimensionType): ComparisonConfig {
  const from = config.dimensions.find((dimension) => dimension.id === dimensionId);
  if (from === undefined || from.type === type) return config;
  const to: Dimension = { id: from.id, label: from.label, type };
  if (from.hint !== undefined) to.hint = from.hint;
  if (from.icon !== undefined) to.icon = from.icon;
  if (from.yesIcon !== undefined) to.yesIcon = from.yesIcon;
  if (from.noIcon !== undefined) to.noIcon = from.noIcon;
  if (from.yesColor !== undefined) to.yesColor = from.yesColor;
  if (from.noColor !== undefined) to.noColor = from.noColor;
  if (from.markSize !== undefined) to.markSize = from.markSize;
  // Einheit und Vorzug reisen mit: Zahl → Text → Zahl soll sie nicht verlieren.
  // Gespeichert werden sie nur bei Zahlen (`serializeDimension`).
  if (from.units !== undefined) to.units = from.units;
  if (from.prefer !== undefined) to.prefer = from.prefer;
  if (type === "choice") {
    // Aus den bisherigen Texten werden Optionen — so geht beim Wechsel nichts
    // verloren. Eine Liste gibt je Eintrag eine Option.
    const labels = [
      ...new Set(
        config.items.flatMap((item) =>
          (valueAsText(item.values[from.id], from) ?? "").split("\n").map((line) => line.trim()).filter((line) => line !== ""),
        ),
      ),
    ].slice(0, MAX_CHOICE_OPTIONS);
    to.options = labels.map((label) => ({ id: newId(), label }));
  }
  return {
    ...config,
    dimensions: config.dimensions.map((dimension) => (dimension.id === dimensionId ? to : dimension)),
    items: config.items.map((item) => {
      const { [dimensionId]: previous, ...rest } = item.values;
      const next = convertValue(previous, from, to);
      return { ...item, values: next === undefined ? rest : { ...rest, [dimensionId]: next } };
    }),
  };
}

/** Die Zeichen für Ja und Nein einer Dimension, mit Vorgaben. */
export const boolIcons = (dimension: Dimension): { yes: string; no: string } => ({
  yes: dimension.yesIcon ?? DEFAULT_YES_ICON,
  no: dimension.noIcon ?? DEFAULT_NO_ICON,
});

/** Alle Icons, die der Vergleich zeigt — damit nur deren Zeichnungen geladen werden. */
export function usedIconIds(config: ComparisonConfig): string[] {
  const ids = [
    ...config.dimensions.flatMap((dimension) => {
      const own = dimension.icon === undefined ? [] : [dimension.icon];
      if (dimension.type !== "bool") return own;
      const { yes, no } = boolIcons(dimension);
      return [...own, yes, no];
    }),
    ...config.items.flatMap((item) => (item.icon === undefined ? [] : [item.icon])),
    // Icons im Fließtext der Werte.
    ...config.dimensions.flatMap((dimension) =>
      dimension.type === "text" || dimension.type === "list"
        ? config.items.flatMap((item) => {
            const value = item.values[dimension.id];
            return typeof value === "string" ? iconIdsIn(value) : Array.isArray(value) ? iconIdsIn((value as string[]).join("")) : [];
          })
        : [],
    ),
  ];
  return [...new Set(ids)];
}

/**
 * Eine Kopie der Dimension direkt dahinter, mit neuer Kennung und den Werten
 * aller Elemente – wie eine kopierte Zeile. Optionen behalten ihre Kennungen;
 * sie gelten je Dimension. An der Höchstzahl bleibt alles, wie es ist.
 */
export function duplicateDimension(config: ComparisonConfig, dimensionId: string): { config: ComparisonConfig; id?: string } {
  const at = config.dimensions.findIndex((dimension) => dimension.id === dimensionId);
  const source = config.dimensions[at];
  if (source === undefined || config.dimensions.length >= MAX_DIMENSIONS) return { config };
  const copy: Dimension = {
    ...source,
    id: newId(),
    label: source.label === "" ? "" : `${source.label} (Kopie)`,
    ...(source.options === undefined ? {} : { options: source.options.map((option) => ({ ...option })) }),
  };
  return {
    id: copy.id,
    config: {
      ...config,
      dimensions: [...config.dimensions.slice(0, at + 1), copy, ...config.dimensions.slice(at + 1)],
      items: config.items.map((item) => {
        const value = item.values[source.id];
        return value === undefined ? item : { ...item, values: { ...item.values, [copy.id]: value } };
      }),
    },
  };
}

/** Die eigenen Farben aller Ja/Nein-Dimensionen – zum erneuten Wählen. */
export const usedColors = (config: ComparisonConfig): string[] => [
  ...new Set(config.dimensions.flatMap((dimension) => [dimension.yesColor, dimension.noColor].filter((hex): hex is string => hex !== undefined))),
];

/** Setzt oder löscht (`undefined`) den Wert eines Elements zu einer Dimension. */
export function setItemValue(item: ComparisonItem, dimensionId: string, value: CellValue | undefined): ComparisonItem {
  const { [dimensionId]: _dropped, ...rest } = item.values;
  void _dropped;
  return { ...item, values: value === undefined ? rest : { ...rest, [dimensionId]: value } };
}
