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
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShellProvider, type ConfigShellState } from "@man/config-ui";
import { stubMediaClient } from "@shared/media/media-client.testing";

import { ComparisonConfig, emptyConfig } from "../comparison-model";
import { sampleConfig } from "../fixtures.testing";
import { ComparisonEditor, orderById } from "./comparison-editor";

// Die Zeichnungen kommen sonst asynchron nach dem Test an (act-Warnung); hier geht es nicht um sie.
jest.mock("@shared/icons/use-icon-stylesheet", () => ({ useIconMasks: () => "", useIconStylesheet: () => "" }));

interface Harness {
  latest: () => ComparisonConfig;
}

const shellState = (overrides: Partial<ConfigShellState> = {}): ConfigShellState => ({
  view: "editor",
  setView: () => undefined,
  preview: true,
  issuesVisible: false,
  ...overrides,
});

const setup = (initial: ComparisonConfig, shell: Partial<ConfigShellState> = {}): Harness => {
  const onChange = jest.fn<void, [ComparisonConfig]>();
  const client = stubMediaClient();

  function Live(): React.ReactElement {
    const [value, setValue] = React.useState(initial);
    return (
      <ConfigShellProvider value={shellState(shell)}>
        <ComparisonEditor
          value={value}
          mediaClient={client}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      </ConfigShellProvider>
    );
  }

  render(<Live />);
  return { latest: () => onChange.mock.calls[onChange.mock.calls.length - 1]![0] };
};

const openTab = async (name: string): Promise<void> => {
  await userEvent.click(screen.getByRole("tab", { name }));
};

describe("ComparisonEditor", () => {
  it("zeigt links die Elemente, in der Mitte die Werte des ersten und rechts die Dimensionen", () => {
    setup(sampleConfig());
    const list = screen.getByRole("grid", { name: "Elemente" });
    expect(within(list).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Element 1 von 2")).toBeInTheDocument();
    expect(screen.getByTestId("cmp-item-0-name")).toHaveValue("Modell A");
    expect(screen.getByTestId("cmp-item-0-value-power")).toHaveValue("510");
    expect(screen.getByTestId("cmp-item-0-value-fuel")).toHaveValue("28,5");
    expect(screen.getByTestId("cmp-item-0-value-extras").innerHTML).toBe("<ul><li>Tempomat</li><li>Kühlbox</li></ul>");
    expect(screen.getByTestId("cmp-item-0-value-note")).toHaveTextContent("Gut");
    expect(screen.getByRole("tab", { name: "Dimensionen", selected: true })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Dimensionen" })).getAllByRole("listitem")).toHaveLength(9);
  });

  it("legt ein Element an und wählt es", async () => {
    const h = setup(sampleConfig());
    await userEvent.click(screen.getByRole("button", { name: /Neues Element/ }));
    expect(h.latest().items).toHaveLength(3);
    expect(screen.getByText("Element 3 von 3")).toBeInTheDocument();
    await userEvent.type(screen.getByTestId("cmp-item-2-name"), "Modell C");
    expect(h.latest().items[2]!.name).toBe("Modell C");
  });

  it("schreibt Zahlen mit Komma und behält den Rohtext beim Tippen", async () => {
    const h = setup(sampleConfig());
    const field = screen.getByTestId("cmp-item-0-value-power");
    await userEvent.clear(field);
    expect(h.latest().items[0]!.values.power).toBeUndefined();
    await userEvent.type(field, "12,");
    expect(field).toHaveValue("12,");
    await userEvent.type(field, "5");
    expect(h.latest().items[0]!.values.power).toBe(12.5);
  });

  it("liest Listen aus Punkten und Zeilen des Textfelds", () => {
    const h = setup(sampleConfig());
    const field = screen.getByTestId("cmp-item-0-value-extras");
    field.innerHTML = '<ul><li>Tempomat</li><li>Kühlbox <span data-man-icon="craft/check"></span></li></ul><p>Standklima<br>Navi</p>';
    fireEvent.input(field);
    const extras = h.latest().items[0]!.values.extras as string[];
    expect(extras).toHaveLength(4);
    expect(extras[1]).toMatch(/^Kühlbox <span data-man-icon="craft\/check"/);
    expect(extras.slice(2)).toEqual(["Standklima", "Navi"]);
  });

  it("schreibt Fließtext bereinigt und leert ihn zu „keine Angabe“", () => {
    const h = setup(sampleConfig());
    const field = screen.getByTestId("cmp-item-0-value-note");
    field.innerHTML = "<div>Neu<script>x</script></div>";
    fireEvent.input(field);
    expect(h.latest().items[0]!.values.note).toBe("<p>Neu</p>");
    field.innerHTML = "";
    fireEvent.input(field);
    expect(h.latest().items[0]!.values.note).toBeUndefined();
  });

  it("setzt Ja/Nein und Bewertung über Pills", async () => {
    const h = setup(sampleConfig());
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Klimaanlage" })).getByRole("radio", { name: "Nein" }));
    expect(h.latest().items[0]!.values.ac).toBe(false);
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Klimaanlage" })).getByRole("radio", { name: "Keine Angabe" }));
    expect(h.latest().items[0]!.values.ac).toBeUndefined();
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Komfort" })).getByRole("radio", { name: "★★" }));
    expect(h.latest().items[0]!.values.stars).toBe(2);
  });

  it("entfernt Bilder der Galerie und ändert ihre Beschreibung", async () => {
    const h = setup(sampleConfig());
    await userEvent.type(screen.getByTestId("cmp-item-0-value-pics-1-alt"), "!");
    expect((h.latest().items[0]!.values.pics as { alt: string }[])[1]!.alt).toBe("A hinten!");
    await userEvent.click(screen.getByTestId("cmp-item-0-value-pics-0-remove"));
    expect(h.latest().items[0]!.values.pics).toEqual([{ url: "https://example.com/a2.jpg", alt: "A hinten!" }]);
  });

  it("legt eine Dimension an, benennt sie und wechselt ihren Typ", async () => {
    const h = setup({ ...sampleConfig(), dimensions: [] });
    await userEvent.click(screen.getByTestId("cmp-add-dimension"));
    expect(h.latest().dimensions).toHaveLength(1);
    await userEvent.type(screen.getByTestId("cmp-dimension-0-label"), "Achsen");
    expect(h.latest().dimensions[0]).toMatchObject({ label: "Achsen", type: "text" });
    // Die Mitte zeigt sofort ein Feld für die neue Dimension.
    expect(screen.getByTestId("cmp-item-0-value-" + h.latest().dimensions[0]!.id)).toBeInTheDocument();
  });

  it("löscht eine Dimension samt ihren Werten", async () => {
    const h = setup(sampleConfig());
    await userEvent.click(screen.getByRole("button", { name: /Leistung/ }));
    const form = screen.getByTestId("cmp-dimension-1");
    await userEvent.click(within(form).getByRole("button", { name: /Dimension löschen/ }));
    expect(h.latest().dimensions.map((entry) => entry.id)).not.toContain("power");
    expect(h.latest().items[0]!.values.power).toBeUndefined();
  });

  it("legt Optionen einer Auswahl an", async () => {
    const h = setup(sampleConfig());
    await userEvent.click(screen.getByRole("button", { name: /Fahrerhaus/ }));
    await userEvent.click(screen.getByTestId("cmp-dimension-4-add-option"));
    await userEvent.type(screen.getByTestId("cmp-dimension-4-option-2"), "GN");
    expect(h.latest().dimensions[4]!.options!.map((option) => option.label)).toEqual(["GX", "GM", "GN"]);
  });

  it("ändert Überschrift und Schalter unter Gestaltung und Verhalten", async () => {
    const h = setup(sampleConfig());
    await openTab("Gestaltung");
    await userEvent.clear(screen.getByTestId("cmp-heading"));
    await userEvent.type(screen.getByTestId("cmp-heading"), "Neu");
    expect(h.latest().heading).toBe("Neu");
    await userEvent.click(screen.getByTestId("cmp-mark-best"));
    expect(h.latest().markBest).toBe(false);
    await openTab("Verhalten");
    await userEvent.click(screen.getByTestId("cmp-difference-toggle-setting"));
    expect(h.latest().differenceToggle).toBe(true);
  });

  it("dupliziert und löscht Elemente", async () => {
    const h = setup(sampleConfig());
    await userEvent.click(screen.getByRole("button", { name: /Element duplizieren/ }));
    expect(h.latest().items.map((item) => item.name)).toEqual(["Modell A", "Modell A (Kopie)", "Modell B"]);
    expect(screen.getByText("Element 2 von 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Element löschen/ }));
    expect(h.latest().items.map((item) => item.name)).toEqual(["Modell A", "Modell B"]);
  });

  it("wählt nach Verschieben und Löschen den richtigen Nachbarn", async () => {
    const config = sampleConfig();
    const h = setup({ ...config, items: [...config.items, { id: "c", name: "Modell C", values: {} }] });
    await userEvent.click(screen.getByText("Modell C"));
    await userEvent.click(screen.getByRole("button", { name: /Element nach vorne/ }));
    await userEvent.click(screen.getByRole("button", { name: /Element nach vorne/ }));
    expect(screen.getByText("Element 1 von 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Element löschen/ }));
    expect(h.latest().items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(screen.getByTestId("cmp-item-0-name")).toHaveValue("Modell A");
  });

  it("markiert fehlende Namen erst nach gescheitertem Übernehmen", () => {
    setup({ ...emptyConfig(), items: [{ id: "a", name: "", values: {} }] }, { issuesVisible: true });
    expect(screen.getByText("Der Name steht über der Spalte.")).toBeInTheDocument();
  });

  it("zeigt in der Vorschau die Tabelle", () => {
    setup(sampleConfig(), { view: "desktop" });
    expect(within(screen.getByTestId("cmp-preview")).getByRole("table")).toBeInTheDocument();
  });
});

describe("orderById", () => {
  it("ordnet nach Kennungen, Unbekanntes fällt weg, Fehlendes bleibt hinten", () => {
    const entries = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(orderById(entries, ["c", "x", "a"]).map((entry) => entry.id)).toEqual(["c", "a", "b"]);
  });
});
