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
 * Die Icons-Leiste für die Textfelder des Editors: ein Kontext mit
 * `useRichTextIcons`, aus dem jedes Feld seine Props holt.
 */

import { createContext, useContext } from "react";
import type { RichTextIconFieldProps, RichTextIcons } from "@shared/icons/use-rich-text-icons";

export const EditorIconsContext = createContext<RichTextIcons | null>(null);

/** Die Props, mit denen ein Textfeld Icons annimmt; ohne Kontext (Tests) keine. */
export function useFieldIcons(target: string): Partial<RichTextIconFieldProps> {
  const icons = useContext(EditorIconsContext);
  return icons === null ? {} : icons.fieldProps(target);
}
