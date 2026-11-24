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

/** Die Namen der Typen, Vorzüge und Farben — für Inspektor, Liste und Formular. */

import { ComparisonAccent, DimensionType, MarkSize, NumberPreference } from "../comparison-model";

export const TYPE_LABELS: Record<DimensionType, { title: string; hint: string }> = {
  text: { title: "Text", hint: "Freier Text; Zeilenumbrüche bleiben." },
  number: { title: "Zahl", hint: "Zahl mit Einheit; auf Wunsch wird der beste Wert markiert." },
  bool: { title: "Ja/Nein", hint: "Haken oder Kreuz." },
  list: { title: "Liste", hint: "Mehrere Einträge als Aufzählung, je Zeile einer." },
  choice: { title: "Auswahl", hint: "Ein Wert aus festen Optionen, die Sie hier festlegen." },
  rating: { title: "Bewertung", hint: "1 bis 5 Sterne; der höchste Wert gilt als Bestwert." },
  gallery: { title: "Galerie", hint: "Bilder zum Durchblättern und Vergrößern. Vergleicht nichts." },
};

export const PREFERENCE_LABELS: Record<NumberPreference, string> = {
  none: "Neutral",
  higher: "Höher ist besser",
  lower: "Niedriger ist besser",
};

export const MARK_SIZE_LABELS: Record<MarkSize, string> = {
  small: "Kleiner",
  normal: "Normal",
  large: "Größer",
};

export const ACCENT_LABELS: Record<ComparisonAccent, { title: string; swatch: string }> = {
  red: { title: "Rot", swatch: "#e40045" },
  grey: { title: "Anthrazit", swatch: "#303c49" },
  blue: { title: "Blau", swatch: "#3875b2" },
};
