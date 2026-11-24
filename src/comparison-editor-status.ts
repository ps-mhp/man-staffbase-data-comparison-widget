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
 * Was „Übernehmen“ verhindert und was die Statuszeile über die Änderungen
 * sagt.
 */

import type { ValidationIssue } from "@man/config-ui/shell/shell-context";

import { ComparisonConfig, ComparisonItem, Dimension } from "./comparison-model";

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Warum eine Dimension so nicht geht; `undefined` = sie geht. */
export function dimensionIssue(dimension: Dimension): string | undefined {
  if (dimension.label.trim() === "") return "Name fehlt";
  if (dimension.type === "choice") {
    const options = dimension.options ?? [];
    if (options.length === 0) return "Auswahl ohne Optionen";
    if (options.some((option) => option.label.trim() === "")) return "Option ohne Namen";
  }
  return undefined;
}

/** Warum ein Element so nicht geht; `undefined` = es geht. */
export const itemIssue = (item: ComparisonItem): string | undefined =>
  item.name.trim() === "" ? "Name fehlt" : undefined;

/**
 * Jedes Element braucht einen Namen (der Spaltenkopf), jede Dimension einen
 * Namen (der Zeilenkopf), jede Auswahl benannte Optionen.
 */
export function validateComparison(draft: ComparisonConfig): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  draft.items.forEach((item, index) => {
    const issue = itemIssue(item);
    if (issue !== undefined) issues.push({ id: item.id, message: `Element ${index + 1}: ${issue}` });
  });
  draft.dimensions.forEach((dimension, index) => {
    const issue = dimensionIssue(dimension);
    if (issue !== undefined) issues.push({ id: dimension.id, message: `Dimension ${index + 1}: ${issue}` });
  });
  return issues;
}

/** Einträge, die neu sind oder anders lauten, plus die entfernten; jeder zählt einmal. */
function changedCount<T extends { id: string }>(draft: readonly T[], saved: readonly T[]): number {
  const before = new Map(saved.map((entry) => [entry.id, entry]));
  const changed = draft.filter((entry) => !sameJson(entry, before.get(entry.id))).length;
  const kept = new Set(draft.map((entry) => entry.id));
  return changed + saved.filter((entry) => !kept.has(entry.id)).length;
}

const sameOrder = <T extends { id: string }>(draft: readonly T[], saved: readonly T[]): boolean =>
  draft.length === saved.length && draft.every((entry, index) => entry.id === saved[index]?.id);

function settingsChanged(draft: ComparisonConfig, saved: ComparisonConfig): boolean {
  return (
    draft.heading !== saved.heading ||
    draft.accent !== saved.accent ||
    draft.highlightDifferences !== saved.highlightDifferences ||
    draft.markBest !== saved.markBest ||
    draft.differenceToggle !== saved.differenceToggle
  );
}

const counted = (count: number, one: string, many: string): string => (count === 1 ? `1 ${one}` : `${count} ${many}`);

function listPart<T extends { id: string }>(draft: readonly T[], saved: readonly T[], one: string, many: string): string | undefined {
  const count = changedCount(draft, saved);
  if (count > 0) return `${counted(count, one, many)} geändert`;
  return sameOrder(draft, saved) ? undefined : `Reihenfolge der ${many} geändert`;
}

/** Die Statuszeile, z. B. „2 Elemente geändert · 1 Dimension geändert“; `undefined` = nichts geändert. */
export function comparisonChangesStatus(draft: ComparisonConfig, saved: ComparisonConfig): string | undefined {
  const parts = [
    listPart(draft.items, saved.items, "Element", "Elemente"),
    listPart(draft.dimensions, saved.dimensions, "Dimension", "Dimensionen"),
    settingsChanged(draft, saved) ? "Einstellungen geändert" : undefined,
  ].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(" · ");
}
