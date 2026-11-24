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

import { Columns3 } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";
import { CONFIG_ATTRIBUTE } from "./configuration-schema";
import { COMPARISON_EDITOR_HELP } from "./comparison-editor-help";
import { comparisonChangesStatus, validateComparison } from "./comparison-editor-status";
import { ComparisonConfig, encodeConfigAttribute, parseConfig } from "./comparison-model";

// Erst im Studio nachgeladen: der Editor gehört nicht ins Bündel, das jede
// veröffentlichte Seite lädt.
const LazyComparisonEditor = React.lazy(() =>
  import("./editors/comparison-editor").then((module) => ({ default: module.ComparisonEditor })),
);

const LOADING = React.createElement(
  "p",
  { className: "p-6 text-sm text-muted-foreground" },
  "Editor wird geladen …",
);

/** Was der gemeinsame Rahmen vom Datenvergleich wissen muss. Offengelegt für Tests. */
export const comparisonEditorShell: FieldModalShellOptions<ComparisonConfig> = {
  widgetName: "Datenvergleich",
  title: "Vergleich bearbeiten",
  icon: Columns3,
  preview: true,
  help: COMPARISON_EDITOR_HELP,
  statusText: comparisonChangesStatus,
  validate: validateComparison,
};

/** Läuft die Seite im Studio — und nicht als veröffentlichte Seite? */
export function isStudioPage(location: Location = window.location): boolean {
  return location.pathname.startsWith("/studio/");
}

/**
 * Wartet auf den Konfigurationsdialog des Vergleichs und setzt den Editor an
 * die Stelle des Feldes `comparison-config`.
 *
 * @param root der zu beobachtende Teilbaum; standardmäßig das Dokument.
 * @returns eine Funktion, die die Beobachtung beendet und den Editor abbaut.
 */
export function startComparisonEditorInjector(root: ParentNode = document): () => void {
  return startFieldModalInjector<ComparisonConfig>({
    fieldKey: CONFIG_ATTRIBUTE,
    root,
    reopenLabel: "Datenvergleich bearbeiten",
    modalTestId: "comparison-editor-modal",
    reopenTestId: "comparison-editor-reopen",
    parse: parseConfig,
    serialize: encodeConfigAttribute,
    // Kopf, Übernehmen, Rückgängig, Hilfe und Rückfrage zeichnet der Rahmen.
    shell: comparisonEditorShell,
    render: ({ value, onChange }) =>
      React.createElement(
        React.Suspense,
        { fallback: LOADING },
        React.createElement(LazyComparisonEditor, { value, onChange }),
      ),
  });
}
