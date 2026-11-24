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
 * Was eine Zeile vergleicht: unterscheiden sich die Elemente, und wer hat
 * den besten Wert? Die Galerie vergleicht nichts — sie zeigt nur Bilder.
 *
 * Frei von DOM und React.
 */

import { CellValue, ComparisonItem, Dimension, normalizeValue, primaryNumber } from "./comparison-model";

/** Der Wert eines Elements zu einer Dimension, in der Form des Typs; `undefined` = keine Angabe. */
export const cellValue = (item: ComparisonItem, dimension: Dimension): CellValue | undefined =>
  normalizeValue(dimension, item.values[dimension.id]);

/** Ob die Dimension überhaupt vergleicht. */
export const isComparable = (dimension: Dimension): boolean => dimension.type !== "gallery";

/** Ein Schlüssel, an dem gleiche Werte gleich sind; leer für „keine Angabe“. */
function compareKey(value: CellValue | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "string") return `s:${value.trim().toLowerCase()}`;
  if (Array.isArray(value)) {
    // Eine Liste ist eine Menge: dieselben Einträge in anderer Folge sind gleich.
    return `l:${(value as string[]).map((entry) => entry.trim().toLowerCase()).sort().join("\u0000")}`;
  }
  if (typeof value === "object") {
    // Zahlen je Einheit: gleich, wenn jede Einheit dieselbe Zahl trägt.
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `u:${JSON.stringify(entries)}`;
  }
  return `${typeof value}:${String(value)}`;
}

/**
 * Ob sich die Elemente in dieser Zeile unterscheiden. „Keine Angabe“ zählt
 * als eigener Wert: eins mit und eins ohne Klimaanlage unterscheiden sich.
 * Unter zwei Elementen gibt es nichts zu unterscheiden.
 */
export function rowDiffers(items: readonly ComparisonItem[], dimension: Dimension): boolean {
  if (!isComparable(dimension) || items.length < 2) return false;
  const keys = new Set(items.map((item) => compareKey(cellValue(item, dimension))));
  return keys.size > 1;
}

/** Ob in der Zeile irgendein Element einen Wert trägt; leere Zeilen bleiben weg. */
export const rowHasValues = (items: readonly ComparisonItem[], dimension: Dimension): boolean =>
  items.some((item) => cellValue(item, dimension) !== undefined);

/** In welche Richtung der Bestwert liegt; `null` = es gibt keinen. */
function bestDirection(dimension: Dimension): "higher" | "lower" | null {
  if (dimension.type === "rating") return "higher";
  if (dimension.type === "number" && dimension.prefer !== undefined && dimension.prefer !== "none") return dimension.prefer;
  return null;
}

/**
 * Die Elemente mit dem besten Wert der Zeile. Leer, wenn die Dimension keinen
 * Vorzug kennt, weniger als zwei Elemente einen Wert tragen oder alle gleich
 * sind — ein Gleichstand aller ist kein Bestwert.
 */
export function bestItemIds(items: readonly ComparisonItem[], dimension: Dimension): ReadonlySet<string> {
  const direction = bestDirection(dimension);
  if (direction === null) return new Set();
  // Bei mehreren Einheiten zählt die erste.
  const numbers = items.flatMap((item) => {
    const value = primaryNumber(cellValue(item, dimension), dimension);
    return value === null ? [] : [{ id: item.id, value }];
  });
  if (numbers.length < 2) return new Set();
  const values = numbers.map((entry) => entry.value);
  const best = direction === "higher" ? Math.max(...values) : Math.min(...values);
  const winners = numbers.filter((entry) => entry.value === best);
  if (winners.length === numbers.length) return new Set();
  return new Set(winners.map((entry) => entry.id));
}

/** Eine Zahl in der Schreibweise der Seite, mit Einheit. */
export function formatNumber(value: number, unit: string | undefined, locale: string | undefined): string {
  let text: string;
  try {
    text = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
  } catch {
    // Eine unbekannte Sprachkennung der Seite darf die Zahl nicht verschlucken.
    text = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(value);
  }
  const suffix = unit?.trim() ?? "";
  if (suffix === "") return text;
  // „%“ und „°“ schließen an, alles andere mit schmalem geschütztem Abstand.
  return /^[%°]/.test(suffix) ? `${text}${suffix}` : `${text}\u202f${suffix}`;
}
