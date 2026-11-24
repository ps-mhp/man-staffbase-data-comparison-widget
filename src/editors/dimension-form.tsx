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
 * Die Felder einer aufgeklappten Dimension in der rechten Leiste: Name, Typ,
 * Erläuterung und was der Typ zusätzlich braucht (Einheit und Vorzug einer
 * Zahl, Optionen einer Auswahl).
 */

import * as React from "react";
import { ReactElement } from "react";
import { Plus, X } from "lucide-react";
import { Field } from "@man/config-ui/form/field";
import { Note } from "@man/config-ui/form/note";
import { SegmentedField } from "@man/config-ui/form/segmented-field";
import type { SegmentedOption } from "@man/config-ui/form/segmented";
import { Button } from "@man/config-ui/primitives/button";
import { Input } from "@man/config-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@man/config-ui/primitives/select";
import { ItemActions } from "@man/config-ui/sidebar/item-actions";
import { ColorTool } from "@man/config-ui/toolbar/color-tool";
import { IconField } from "@shared/icons/icon-field";
import { IconGlyph } from "@shared/icons/icon-glyph";

import { dimensionIssue } from "../comparison-editor-status";
import {
  ChoiceOption,
  DEFAULT_NO_ICON,
  DEFAULT_YES_ICON,
  DIMENSION_TYPES,
  MARK_SIZES,
  MarkSize,
  Dimension,
  DimensionType,
  NUMBER_PREFERENCES,
  NumberPreference,
  newId,
} from "../comparison-model";
import { MARK_SIZE_LABELS, PREFERENCE_LABELS, TYPE_LABELS } from "./labels";

export interface DimensionFormProps {
  dimension: Dimension;
  index: number;
  total: number;
  issuesVisible: boolean;
  onChange: (dimension: Dimension) => void;
  onTypeChange: (type: DimensionType) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  /** An der Höchstzahl gesperrt. */
  canDuplicate: boolean;
  onRemove: () => void;
  /** Eigene Farben anderer Dimensionen, zum erneuten Wählen. */
  recentColors: readonly string[];
}

const MARK_SIZE_OPTIONS: readonly SegmentedOption<MarkSize>[] = MARK_SIZES.map((id) => ({ id, label: MARK_SIZE_LABELS[id] }));

const PREFERENCE_OPTIONS: readonly SegmentedOption<NumberPreference>[] = NUMBER_PREFERENCES.map((id) => ({
  id,
  label: PREFERENCE_LABELS[id],
}));

/** Ohne die Eigenschaft statt mit leerem Wert: so bleibt das Attribut schlank. */
function withOptional(
  dimension: Dimension,
  key: "hint" | "unit" | "icon" | "yesIcon" | "noIcon" | "yesColor" | "noColor",
  text: string | undefined,
): Dimension {
  if (text !== undefined && text !== "") return { ...dimension, [key]: text };
  const { [key]: _dropped, ...rest } = dimension;
  void _dropped;
  return rest;
}

interface OptionsEditorProps {
  options: readonly ChoiceOption[];
  testId: string;
  invalid: boolean;
  onChange: (options: ChoiceOption[]) => void;
}

function OptionsEditor({ options, testId, invalid, onChange }: OptionsEditorProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-foreground">Optionen</span>
      {options.length === 0 && (
        <p className={invalid ? "text-[13px] text-destructive" : "text-[13px] text-muted-foreground"}>
          Noch keine Option. Je Option ein Wert, den die Elemente wählen können.
        </p>
      )}
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-1.5">
          <Input
            className="h-9"
            aria-label={`Option ${index + 1}`}
            aria-invalid={(invalid && option.label.trim() === "") || undefined}
            value={option.label}
            placeholder={`Option ${index + 1}`}
            data-testid={`${testId}-option-${index}`}
            onChange={(event) =>
              onChange(options.map((entry) => (entry.id === option.id ? { ...entry, label: event.target.value } : entry)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Option ${index + 1} entfernen`}
            onClick={() => onChange(options.filter((entry) => entry.id !== option.id))}
          >
            <X aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        data-testid={`${testId}-add-option`}
        onClick={() => onChange([...options, { id: newId(), label: "" }])}
      >
        <Plus aria-hidden />
        Option hinzufügen
      </Button>
    </div>
  );
}

function TypeSelect({ value, testId, onChange }: { value: DimensionType; testId: string; onChange: (type: DimensionType) => void }): ReactElement {
  return (
    <Select value={value} onValueChange={(type) => onChange(type as DimensionType)}>
      <Field label="Typ" hint={TYPE_LABELS[value].hint}>
        <SelectTrigger className="w-full" data-testid={`${testId}-type`}>
          <SelectValue />
        </SelectTrigger>
      </Field>
      <SelectContent position="popper">
        {DIMENSION_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {TYPE_LABELS[type].title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface BoolSideProps {
  dimension: Dimension;
  side: "yes" | "no";
  testId: string;
  recentColors: readonly string[];
  onChange: (dimension: Dimension) => void;
}

/** Zeichen und Farbe für Ja oder Nein. */
function BoolSide({ dimension, side, testId, recentColors, onChange }: BoolSideProps): ReactElement {
  const word = side === "yes" ? "Ja" : "Nein";
  const iconKey = side === "yes" ? "yesIcon" : "noIcon";
  const colorKey = side === "yes" ? "yesColor" : "noColor";
  const fallbackIcon = side === "yes" ? DEFAULT_YES_ICON : DEFAULT_NO_ICON;
  const icon = dimension[iconKey] ?? fallbackIcon;
  return (
    <div className="flex flex-col gap-2">
      <IconField
        key={`${dimension.id}-${side}`}
        label={`Zeichen für ${word}`}
        title={`Zeichen für ${word}`}
        allowNone={false}
        value={icon}
        data-testid={`${testId}-${side}-icon`}
        onChange={(next) => onChange(withOptional(dimension, iconKey, next === fallbackIcon ? undefined : next))}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-foreground">{`Farbe für ${word}`}</span>
        <ColorTool
          testId={`${testId}-${side}-color`}
          label={`Farbe für ${word}`}
          clearLabel={side === "yes" ? "Akzentfarbe" : "Grau"}
          value={dimension[colorKey]}
          recent={recentColors}
          onChange={(hex) => onChange(withOptional(dimension, colorKey, hex))}
          onClear={() => onChange(withOptional(dimension, colorKey, undefined))}
          glyph={<IconGlyph id={icon} className="size-4" />}
          standardBar={side === "yes" ? "var(--primary)" : "var(--muted-foreground)"}
        />
      </div>
    </div>
  );
}

export function DimensionForm({
  dimension,
  index,
  total,
  issuesVisible,
  onChange,
  onTypeChange,
  onMove,
  onDuplicate,
  canDuplicate,
  onRemove,
  recentColors,
}: DimensionFormProps): ReactElement {
  const testId = `cmp-dimension-${index}`;
  const issue = issuesVisible ? dimensionIssue(dimension) : undefined;
  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <Field label="Name" required error={issue === "Name fehlt" ? "Der Name steht in der ersten Spalte." : undefined}>
        <Input
          data-testid={`${testId}-label`}
          value={dimension.label}
          placeholder="z. B. Leistung"
          // Frisch angelegt: gleich lostippen.
          autoFocus={dimension.label === ""}
          onChange={(event) => onChange({ ...dimension, label: event.target.value })}
        />
      </Field>
      <TypeSelect value={dimension.type} testId={testId} onChange={onTypeChange} />
      <IconField
        // Je Dimension ein eigenes Feld: die offene Auswahl gehört nicht zur nächsten.
        key={`${dimension.id}-icon`}
        label="Icon vor dem Namen"
        title={`Icon für ${dimension.label || "die Dimension"}`}
        value={dimension.icon}
        data-testid={`${testId}-icon`}
        onChange={(icon) => onChange(withOptional(dimension, "icon", icon))}
      />
      <Field label="Erläuterung" hint="Optional, klein unter dem Namen.">
        <Input
          data-testid={`${testId}-hint`}
          value={dimension.hint ?? ""}
          placeholder="z. B. nach ECE R85"
          onChange={(event) => onChange(withOptional(dimension, "hint", event.target.value))}
        />
      </Field>
      {dimension.type === "number" && (
        <>
          <Field label="Einheit" hint="Steht hinter jeder Zahl.">
            <Input
              data-testid={`${testId}-unit`}
              value={dimension.unit ?? ""}
              placeholder="z. B. PS"
              onChange={(event) => onChange(withOptional(dimension, "unit", event.target.value))}
            />
          </Field>
          <SegmentedField
            label="Bestwert"
            hint="Welche Zahl markiert wird, wenn unter „Gestaltung“ Bestwerte an sind."
            options={PREFERENCE_OPTIONS}
            value={dimension.prefer ?? "none"}
            onChange={(prefer) => onChange(prefer === "none" ? { ...dimension, prefer: undefined } : { ...dimension, prefer })}
          />
        </>
      )}
      {dimension.type === "bool" && (
        <>
          <BoolSide dimension={dimension} side="yes" testId={testId} recentColors={recentColors} onChange={onChange} />
          <BoolSide dimension={dimension} side="no" testId={testId} recentColors={recentColors} onChange={onChange} />
          <SegmentedField
            label="Größe der Zeichen"
            hint="Normal ist die Vorgabe; Kleiner und Größer jeweils eine Stufe."
            options={MARK_SIZE_OPTIONS}
            value={dimension.markSize ?? "normal"}
            onChange={(markSize) => onChange(markSize === "normal" ? { ...dimension, markSize: undefined } : { ...dimension, markSize })}
          />
        </>
      )}
      {dimension.type === "choice" && (
        <OptionsEditor
          options={dimension.options ?? []}
          testId={testId}
          invalid={issue !== undefined}
          onChange={(options) => onChange({ ...dimension, options })}
        />
      )}
      {dimension.type === "gallery" && (
        <Note>Je Element ein oder mehrere Bilder. Die Zeile vergleicht nichts und wird nie abgeblendet.</Note>
      )}
      <ItemActions
        className="border-t pt-3"
        noun="Dimension"
        onMoveBack={() => onMove(-1)}
        onMoveForward={() => onMove(1)}
        canMoveBack={index > 0}
        canMoveForward={index < total - 1}
        onDuplicate={onDuplicate}
        canDuplicate={canDuplicate}
        onDelete={onRemove}
      />
    </div>
  );
}
