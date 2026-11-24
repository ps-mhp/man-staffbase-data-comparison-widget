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
 * Der Editor im gemeinsamen Rahmen, eingehängt in einen echten RJSF-Dialog:
 * Nachladen, Ausgangsstand aus dem Feld, Übernehmen zurück ins Feld.
 */

import * as React from "react";
import { act, render } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { clickElement, modalRoot, settleEditor, settleModal } from "@shared/ui/config-modal.testing";
import { comparisonEditorShell, isStudioPage, startComparisonEditorInjector } from "./comparison-editor-injector";
import { encodeConfigAttribute, parseConfig } from "./comparison-model";
import { CONFIG_ATTRIBUTE, configurationSchema } from "./configuration-schema";
import { sampleConfig } from "./fixtures.testing";

const EDITOR_SELECTOR = '[data-testid="cmp-editor"]';

const mockEditorLoaded = jest.fn();
jest.mock("./editors/comparison-editor", () => {
  mockEditorLoaded();
  return jest.requireActual("./editors/comparison-editor");
});

const inModal = (selector: string): HTMLElement | null => modalRoot()?.querySelector<HTMLElement>(selector) ?? null;

const fieldValue = (container: HTMLElement): string =>
  container.querySelector<HTMLTextAreaElement>(`[id="root_${CONFIG_ATTRIBUTE}"]`)!.value;

async function open(formData: Record<string, string>): Promise<{ container: HTMLElement; stop: () => void }> {
  const { container } = render(<Form schema={configurationSchema} validator={validator} formData={formData} />);
  let stop = (): void => {};
  await act(async () => {
    stop = startComparisonEditorInjector(container);
  });
  await settleEditor(EDITOR_SELECTOR);
  return { container, stop };
}

describe("Nachladen", () => {
  // Muss zuerst laufen: einmal geladen, bleibt das Modul im Speicher.
  it("lädt den Editor erst, wenn der eigene Dialog erscheint", async () => {
    const empty = document.createElement("div");
    document.body.append(empty);
    const stop = startComparisonEditorInjector(empty);
    await settleModal();
    expect(mockEditorLoaded).not.toHaveBeenCalled();
    await act(async () => stop());
    empty.remove();

    const opened = await open({});
    expect(mockEditorLoaded).toHaveBeenCalledTimes(1);
    expect(inModal(EDITOR_SELECTOR)).not.toBeNull();
    await act(async () => opened.stop());
  });
});

describe("startComparisonEditorInjector", () => {
  it("öffnet mit dem gespeicherten Vergleich und schreibt Übernommenes zurück ins Feld", async () => {
    const stored = encodeConfigAttribute(sampleConfig());
    const { container, stop } = await open({ [CONFIG_ATTRIBUTE]: stored });
    expect(inModal('[data-testid="cmp-item-0-name"]')).toHaveValue("Modell A");

    await clickElement(inModal('[data-testid="cmp-editor"] button[aria-label*="Element löschen"]'));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    const saved = parseConfig(fieldValue(container));
    expect(saved.items.map((item) => item.name)).toEqual(["Modell B"]);
    await act(async () => stop());
  });
});

describe("comparisonEditorShell", () => {
  it("gibt dem Rahmen Namen, Vorschau, Status und Prüfung", () => {
    expect(comparisonEditorShell.widgetName).toBe("Datenvergleich");
    expect(comparisonEditorShell.preview).toBe(true);
    expect(comparisonEditorShell.help).toBeTruthy();
    expect(typeof comparisonEditorShell.statusText).toBe("function");
    expect(typeof comparisonEditorShell.validate).toBe("function");
  });
});

describe("isStudioPage", () => {
  it("erkennt das Studio am Pfad", () => {
    expect(isStudioPage({ pathname: "/studio/x" } as Location)).toBe(true);
    expect(isStudioPage({ pathname: "/content/x" } as Location)).toBe(false);
  });
});
