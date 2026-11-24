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
 * Die rechte Leiste: zuerst die Dimensionen (was verglichen wird), dazu
 * Gestaltung und Verhalten der Tabelle.
 */

import * as React from "react";
import { ReactElement, useState } from "react";
import { Plus } from "lucide-react";
import { Field } from "@man/config-ui/form/field";
import { SegmentedField } from "@man/config-ui/form/segmented-field";
import type { IconComponent, SegmentedOption } from "@man/config-ui/form/segmented";
import { SubList, type SubListItem } from "@man/config-ui/form/sub-list";
import { SwitchRow } from "@man/config-ui/form/switch-row";
import { InspectorPanel } from "@man/config-ui/inspector/inspector-panel";
import { Button } from "@man/config-ui/primitives/button";
import { Input } from "@man/config-ui/primitives/input";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import { dimensionIssue } from "../comparison-editor-status";
import { COMPARISON_ACCENTS, ComparisonAccent, ComparisonConfig, Dimension, DimensionType, MAX_DIMENSIONS } from "../comparison-model";
import { DimensionForm } from "./dimension-form";
import { ACCENT_LABELS, TYPE_LABELS } from "./labels";

/** Was die Dimensionen-Liste mit dem Vergleich tun kann; das Wie steht im Editor. */
export interface DimensionActions {
  add: () => string | undefined;
  change: (dimension: Dimension) => void;
  changeType: (id: string, type: DimensionType) => void;
  move: (id: string, by: -1 | 1) => void;
  remove: (id: string) => void;
}

export interface ComparisonInspectorProps {
  value: ComparisonConfig;
  onSettings: (patch: Partial<Omit<ComparisonConfig, "dimensions" | "items">>) => void;
  dimensions: DimensionActions;
}

/** Ein Farbpunkt als „Icon“ der Pill; die Farbe ist ein Datum der Marke, kein Theme-Token. */
function swatch(accent: ComparisonAccent): IconComponent {
  function Swatch(): ReactElement {
    return <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: ACCENT_LABELS[accent].swatch }} />;
  }
  return Swatch;
}

const ACCENT_OPTIONS: readonly SegmentedOption<ComparisonAccent>[] = COMPARISON_ACCENTS.map((accent) => ({
  id: accent,
  label: ACCENT_LABELS[accent].title,
  icon: swatch(accent),
}));

function describe(dimension: Dimension): string {
  const type = TYPE_LABELS[dimension.type].title;
  if (dimension.type === "number" && dimension.unit !== undefined) return `${type} · ${dimension.unit}`;
  if (dimension.type === "choice") return `${type} · ${dimension.options?.length ?? 0} Optionen`;
  return type;
}

function subListItems(dimensions: readonly Dimension[], issuesVisible: boolean): SubListItem[] {
  return dimensions.map((dimension, index) => ({
    id: dimension.id,
    label: dimension.label.trim() === "" ? `Dimension ${index + 1}` : dimension.label,
    description: describe(dimension),
    invalid: issuesVisible && dimensionIssue(dimension) !== undefined,
  }));
}

function DimensionsTab({ value, dimensions: actions }: ComparisonInspectorProps): ReactElement {
  const { issuesVisible } = useConfigShell();
  const [openId, setOpenId] = useState<string | null>(null);
  const { dimensions } = value;
  const full = dimensions.length >= MAX_DIMENSIONS;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted-foreground">
        Je Dimension eine Zeile der Tabelle. Die Werte tragen Sie links je Element ein.
      </p>
      <SubList
        aria-label="Dimensionen"
        items={subListItems(dimensions, issuesVisible)}
        openId={openId}
        onOpenChange={setOpenId}
        emptyState="Noch keine Dimension."
        renderItem={(_item, index) => {
          const dimension = dimensions[index]!;
          return (
            <DimensionForm
              dimension={dimension}
              index={index}
              total={dimensions.length}
              issuesVisible={issuesVisible}
              onChange={actions.change}
              onTypeChange={(type) => actions.changeType(dimension.id, type)}
              onMove={(by) => actions.move(dimension.id, by)}
              onRemove={() => {
                actions.remove(dimension.id);
                setOpenId(null);
              }}
            />
          );
        }}
        footer={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            disabled={full}
            data-testid="cmp-add-dimension"
            onClick={() => setOpenId(actions.add() ?? null)}
          >
            <Plus aria-hidden />
            {full ? `Höchstens ${MAX_DIMENSIONS} Dimensionen` : "Neue Dimension"}
          </Button>
        }
      />
    </div>
  );
}

function DesignTab({ value, onSettings }: ComparisonInspectorProps): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Überschrift" hint="Optional, steht über der Tabelle.">
        <Input
          data-testid="cmp-heading"
          value={value.heading}
          placeholder="z. B. Modelle im Vergleich"
          onChange={(event) => onSettings({ heading: event.target.value })}
        />
      </Field>
      <SegmentedField label="Akzent" options={ACCENT_OPTIONS} value={value.accent} onChange={(accent) => onSettings({ accent })} />
      <SwitchRow
        label="Gleiche Zeilen abblenden"
        hint="Zeilen, in denen alle Elemente denselben Wert haben, treten grau zurück – die Unterschiede fallen auf."
        checked={value.highlightDifferences}
        onCheckedChange={(highlightDifferences) => onSettings({ highlightDifferences })}
        data-testid="cmp-highlight-differences"
      />
      <SwitchRow
        label="Bestwerte markieren"
        hint="Bei Zahlen mit Vorzug („Höher/Niedriger ist besser“) und Bewertungen wird der beste Wert hervorgehoben."
        checked={value.markBest}
        onCheckedChange={(markBest) => onSettings({ markBest })}
        data-testid="cmp-mark-best"
      />
    </div>
  );
}

function BehaviourTab({ value, onSettings }: ComparisonInspectorProps): ReactElement {
  return (
    <SwitchRow
      label="Schalter „Nur Unterschiede“"
      hint="Leser:innen können Zeilen ausblenden, in denen sich die Elemente nicht unterscheiden. Ihre Wahl wird nicht gespeichert."
      checked={value.differenceToggle}
      onCheckedChange={(differenceToggle) => onSettings({ differenceToggle })}
      data-testid="cmp-difference-toggle-setting"
    />
  );
}

export function ComparisonInspector(props: ComparisonInspectorProps): ReactElement {
  const { issuesVisible } = useConfigShell();
  const broken = props.value.dimensions.filter((dimension) => dimensionIssue(dimension) !== undefined).length;
  return (
    <InspectorPanel
      title="Datenvergleich"
      tabs={[
        {
          id: "dimensions",
          label: "Dimensionen",
          badge:
            issuesVisible && broken > 0 ? (
              <span className="rounded-full bg-destructive px-1.5 text-[11px] leading-4 text-white">{broken}</span>
            ) : undefined,
          content: <DimensionsTab {...props} />,
        },
        { id: "design", label: "Gestaltung", content: <DesignTab {...props} /> },
        { id: "behaviour", label: "Verhalten", content: <BehaviourTab {...props} /> },
      ]}
    />
  );
}
