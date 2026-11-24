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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

/**
 * Das eine Attribut des Vergleichs: Dimensionen, Elemente und Einstellungen
 * (siehe `comparison-model.ts`).
 *
 * Mit Widgetpräfix: Staffbase gibt jedem Dialogfeld die Kennung
 * `root_<Attribut>`, und die Editoren hängen sich über genau diese Kennung
 * ein — ohne zu wissen, zu welchem Widget der Dialog gehört. Ein geteilter
 * Name ließe fremde Editoren in diesen Dialog (USP-Box 0.1.0-rc.1).
 */
export const CONFIG_ATTRIBUTE = "comparison-config";

/** Alle Attribute des Widgets; `widgets-json.test.ts` gleicht sie mit `widgets.json` ab. */
export const ALL_ATTRIBUTES: string[] = [CONFIG_ATTRIBUTE];

/**
 * Das Schema des Konfigurationsdialogs. Im Studio setzt
 * `comparison-editor-injector.ts` den eigenen Editor an die Stelle des
 * Textfelds; erscheint er einmal nicht, bleibt das Feld als Rückfallweg (JSON).
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    [CONFIG_ATTRIBUTE]: {
      type: "string",
      title: "Datenvergleich",
      default: "",
    },
  },
};

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  [CONFIG_ATTRIBUTE]: {
    "ui:widget": "textarea",
    "ui:help":
      "Normalerweise steht hier der Editor des Datenvergleichs. Erscheint er nicht, " +
      "lässt sich der Vergleich als JSON pflegen, z. B. " +
      '{"heading":"Modelle im Vergleich","dimensions":[{"id":"p","label":"Leistung","type":"number","unit":"PS","prefer":"higher"}],' +
      '"items":[{"id":"a","name":"Modell A","values":{"p":510}},{"id":"b","name":"Modell B","values":{"p":470}}]}',
  },
};
