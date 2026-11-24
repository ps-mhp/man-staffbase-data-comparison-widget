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
 * Text- und Listenwerte als Fließtext mit Icons der Bibliothek.
 *
 * Ein Textwert ist bereinigtes Markup aus `sanitizeRichTextWithIcons`
 * (Absätze, Zeilenumbrüche, Aufzählungen, Icons). Ein Listeneintrag ist eine
 * Zeile davon: Text und Icons, ohne Absatz. Ältere Werte ohne Markup werden
 * beim Lesen dazu.
 *
 * Läuft im Seitenbündel: `DOMParser` aus dem Browser, keine Zeichnungen.
 */

import { ICON_ATTRIBUTE } from "@shared/icons/icon-markup";
import { richTextWithIconsToPlain, sanitizeRichTextWithIcons } from "@shared/icons/rich-text-icons";

/** Ein Textwert in erlaubter Form; leer, wenn weder Text noch Icon bleibt. */
export const sanitizeTextValue = (raw: string): string => sanitizeRichTextWithIcons(raw);

/** Ob eine Zeile etwas zeigt: Text oder ein Icon. */
const hasContent = (html: string): boolean => html.includes(ICON_ATTRIBUTE) || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "";

/** Die Zeilen eines Textwerts: je Zeile eines Absatzes und je Aufzählungspunkt ein Eintrag. */
export function richEntries(raw: string): string[] {
  const html = sanitizeRichTextWithIcons(raw);
  if (html === "") return [];
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  const lines: string[] = [];
  const addLines = (inner: string): void => {
    inner.split("<br>").forEach((line) => {
      const trimmed = line.trim();
      if (hasContent(trimmed)) lines.push(trimmed);
    });
  };
  Array.from(body.children).forEach((block) => {
    if (block.tagName === "UL") Array.from(block.children).forEach((item) => addLines(item.innerHTML));
    else addLines(block.innerHTML);
  });
  return lines;
}

/** Die Einträge einer Liste als Aufzählung – so zeigt sie das Textfeld im Editor. */
export const entriesToHtml = (entries: readonly string[]): string =>
  entries.length === 0 ? "" : `<ul>${entries.map((entry) => `<li>${entry}</li>`).join("")}</ul>`;

/** Der reine Text, Zeilen getrennt; Icons tragen nichts bei. */
export const plainOf = (raw: string): string => richTextWithIconsToPlain(raw);
