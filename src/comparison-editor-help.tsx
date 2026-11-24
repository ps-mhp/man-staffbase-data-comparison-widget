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

import { MAX_ITEMS } from "./comparison-model";

export const COMPARISON_EDITOR_HELP = (
  <ul className="flex list-disc flex-col gap-2 pl-5">
    <li>
      Rechts unter <strong>Dimensionen</strong> legen Sie fest, <em>was</em> verglichen wird – je Dimension eine Zeile
      der Tabelle, mit Name und Typ (Text, Zahl, Ja/Nein, Liste, Auswahl, Bewertung oder Galerie).
    </li>
    <li>
      Links stehen die <strong>Elemente</strong>, die verglichen werden – je Element eine Spalte, höchstens {MAX_ITEMS}.
      Wählen Sie ein Element und tragen Sie in der Mitte zu jeder Dimension seinen Wert ein.
    </li>
    <li>
      Die <strong>Galerie</strong> vergleicht nichts: sie zeigt die Bilder eines Elements zum Durchblättern; Leser:innen
      vergrößern sie über den Rahmen-Knopf.
    </li>
    <li>
      Ein Wechsel des Typs übernimmt die Werte, so weit es geht (Text ↔ Liste, Text → Auswahl); was nicht passt, fällt
      weg – „Rückgängig“ holt es zurück.
    </li>
    <li>
      Unter <strong>Gestaltung</strong> blenden Sie gleiche Zeilen ab und markieren Bestwerte; unter{" "}
      <strong>Verhalten</strong> bekommen Leser:innen den Schalter „Nur Unterschiede“.
    </li>
    <li>Die erste Spalte bleibt auf der Seite beim waagerechten Scrollen stehen.</li>
  </ul>
);
