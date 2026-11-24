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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShellProvider } from "@man/config-ui";

import { Dimension } from "../comparison-model";
import { DimensionForm } from "./dimension-form";

function setup(initial: Dimension, issuesVisible = false) {
  const onChange = jest.fn<void, [Dimension]>();
  const onTypeChange = jest.fn();
  const onMove = jest.fn();
  const onRemove = jest.fn();
  function Live(): React.ReactElement {
    const [value, setValue] = React.useState(initial);
    return (
      <ConfigShellProvider value={{ view: "editor", setView: () => undefined, preview: true, issuesVisible }}>
        <DimensionForm
          dimension={value}
          index={1}
          total={3}
          issuesVisible={issuesVisible}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
          onTypeChange={onTypeChange}
          onMove={onMove}
          onRemove={onRemove}
        />
      </ConfigShellProvider>
    );
  }
  render(<Live />);
  return { latest: () => onChange.mock.calls.at(-1)![0], onTypeChange, onMove, onRemove };
}

describe("DimensionForm", () => {
  it("pflegt Einheit und Bestwert einer Zahl und lässt Leeres weg", async () => {
    const h = setup({ id: "n", label: "Leistung", type: "number" });
    await userEvent.type(screen.getByTestId("cmp-dimension-1-unit"), "kW");
    expect(h.latest().unit).toBe("kW");
    await userEvent.clear(screen.getByTestId("cmp-dimension-1-unit"));
    expect(h.latest()).not.toHaveProperty("unit");
    await userEvent.click(screen.getByRole("radio", { name: "Niedriger ist besser" }));
    expect(h.latest().prefer).toBe("lower");
    await userEvent.click(screen.getByRole("radio", { name: "Neutral" }));
    expect(h.latest().prefer).toBeUndefined();
  });

  it("pflegt die Erläuterung", async () => {
    const h = setup({ id: "t", label: "Notiz", type: "text" });
    await userEvent.type(screen.getByTestId("cmp-dimension-1-hint"), "kurz");
    expect(h.latest().hint).toBe("kurz");
    await userEvent.clear(screen.getByTestId("cmp-dimension-1-hint"));
    expect(h.latest()).not.toHaveProperty("hint");
  });

  it("entfernt Optionen und meldet fehlende", async () => {
    const h = setup({ id: "c", label: "Kabine", type: "choice", options: [{ id: "o", label: "GX" }] }, true);
    await userEvent.click(screen.getByRole("button", { name: "Option 1 entfernen" }));
    expect(h.latest().options).toEqual([]);
    expect(screen.getByText(/Noch keine Option/)).toHaveClass("text-destructive");
  });

  it("erklärt die Galerie und meldet fehlenden Namen", () => {
    setup({ id: "g", label: "", type: "gallery" }, true);
    expect(screen.getByText(/vergleicht nichts/)).toBeInTheDocument();
    expect(screen.getByText("Der Name steht in der ersten Spalte.")).toBeInTheDocument();
  });

  it("verschiebt und löscht", async () => {
    const h = setup({ id: "t", label: "Notiz", type: "text" });
    await userEvent.click(screen.getByRole("button", { name: /Dimension nach oben/ }));
    expect(h.onMove).toHaveBeenCalledWith(-1);
    await userEvent.click(screen.getByRole("button", { name: /Dimension nach unten/ }));
    expect(h.onMove).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByRole("button", { name: /Dimension löschen/ }));
    expect(h.onRemove).toHaveBeenCalled();
  });
});
