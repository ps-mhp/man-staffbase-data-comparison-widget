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
 * Das Eingabefeld für den Wert eines Elements zu einer Dimension — je Typ
 * das passende: Textfeld, Zahl mit Einheit, Ja/Nein-Pills, Liste (je Zeile
 * ein Eintrag), Auswahl, Sterne oder Galerie.
 */

import * as React from "react";
import { ReactElement, useEffect, useState } from "react";
import { Field } from "@man/config-ui/form/field";
import { Segmented, SegmentedOption } from "@man/config-ui/form/segmented";
import { Input } from "@man/config-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@man/config-ui/primitives/select";
import { RichTextField } from "@man/config-ui/rich-text/rich-text-field";

import { CellValue, Dimension, GalleryImage, MAX_RATING, NumberValues, normalizeValue, parseNumber, unitsOf } from "../comparison-model";
import { entriesToHtml, richEntries } from "../rich-values";
import { useFieldIcons } from "./editor-icons";
import { GalleryField } from "./gallery-field";
import { TYPE_LABELS } from "./labels";

export interface ValueFieldProps {
  dimension: Dimension;
  /** Wessen Wert das ist, etwa „Modell A“ — für Namen von Feldern und Mediathek. */
  itemName: string;
  value: CellValue | undefined;
  /** `undefined` heißt „keine Angabe“. */
  onChange: (value: CellValue | undefined) => void;
  testId: string;
}

/**
 * Ein Textfeld, das beim Tippen den Rohtext behält und nur den gelesenen Wert
 * meldet — sonst fräße die Liste beim Enter die neue Zeile und die Zahl das
 * Komma. Ändert sich der Wert von außen (Rückgängig), zieht der Text nach.
 */
function useDraftText<T>(value: T, format: (value: T) => string, matches: (text: string, value: T) => boolean) {
  const [text, setText] = useState(() => format(value));
  useEffect(() => {
    setText((current) => (matches(current, value) ? current : format(value)));
    // Nur der Wert von außen zählt; `format`/`parse`/`same` sind je Typ fest.
  }, [value]);
  return [text, setText] as const;
}

/** Fest statt je Aufruf neu: sonst bekäme die Galerie bei jedem Rendern eine neue Liste. */
const NO_IMAGES: readonly GalleryImage[] = [];

/** Wie die Icons-Leiste das Feld nennt: „In Leistung · Modell A einfügen“. */
const targetOf = ({ dimension, itemName }: ValueFieldProps): string =>
  `${dimension.label || "Wert"} · ${itemName || "Element"}`;

/** Fließtext mit Absätzen, Aufzählungen und Icons aus der Icons-Leiste. */
function TextValue(props: ValueFieldProps): ReactElement {
  const { dimension, value, onChange, testId } = props;
  const icons = useFieldIcons(targetOf(props));
  return (
    <RichTextField
      {...icons}
      aria-label={dimension.label || "Text"}
      toolbarLabel="Text formatieren"
      data-testid={testId}
      value={typeof value === "string" ? value : ""}
      placeholder={`${dimension.label || "Wert"} …`}
      onChange={(html) => onChange(html === "" ? undefined : html)}
    />
  );
}

interface NumberInputProps {
  value: number | null;
  unit: string | undefined;
  /** Name des Felds für Screenreader, wenn es mehrere gibt. */
  ariaLabel?: string;
  testId: string;
  onChange: (value: number | null) => void;
}

/** Ein Zahlenfeld mit Komma und Einheit dahinter; der Rohtext bleibt beim Tippen. */
function NumberInput({ value, unit, ariaLabel, testId, onChange }: NumberInputProps): ReactElement {
  const number = value;
  const [text, setText] = useDraftText<number | null>(
    number,
    (entry) => (entry === null ? "" : String(entry).replace(".", ",")),
    // Ungültiger Rohtext passt nur, solange außen noch ein Wert steht; „Rückgängig“ auf leer räumt ihn weg.
    (draft, current) => (current === null ? draft.trim() === "" : parseNumber(draft) === current),
  );
  const invalid = text.trim() !== "" && parseNumber(text) === null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          className="max-w-[220px]"
          data-testid={testId}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          value={text}
          placeholder="z. B. 510"
          onChange={(event) => {
            setText(event.target.value);
            const parsed = parseNumber(event.target.value);
            if (event.target.value.trim() === "") onChange(null);
            else if (parsed !== null) onChange(parsed);
          }}
        />
        {unit !== undefined && unit.trim() !== "" && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {invalid && <p className="text-[13px] text-destructive">Keine Zahl – gespeichert bleibt der letzte gültige Wert.</p>}
    </div>
  );
}

/** Eine Zahl – oder, bei mehreren Einheiten, je Einheit ein Feld. */
function NumberValue({ dimension, value: raw, onChange, testId }: ValueFieldProps): ReactElement {
  const units = unitsOf(dimension);
  // In der Form der Einheiten gelesen: kam eine zweite Einheit hinzu, gilt die
  // bisherige Zahl der ersten – sonst stünden die Felder leer.
  const value = normalizeValue(dimension, raw);
  if (units.length < 2) {
    return (
      <NumberInput
        value={typeof value === "number" ? value : null}
        unit={units[0]?.label}
        testId={testId}
        onChange={(next) => onChange(next ?? undefined)}
      />
    );
  }
  const values: NumberValues = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as NumberValues) : {};
  return (
    <div className="flex flex-col gap-2">
      {units.map((unit, index) => (
        <NumberInput
          key={unit.id}
          value={values[unit.id] ?? null}
          unit={unit.label}
          ariaLabel={`${dimension.label || "Zahl"} in ${unit.label || `Einheit ${index + 1}`}`}
          testId={`${testId}-${index}`}
          onChange={(next) => {
            const { [unit.id]: _dropped, ...rest } = values;
            void _dropped;
            const merged = next === null ? rest : { ...rest, [unit.id]: next };
            onChange(Object.keys(merged).length === 0 ? undefined : merged);
          }}
        />
      ))}
    </div>
  );
}

type BoolChoice = "yes" | "no" | "none";

const BOOL_OPTIONS: readonly SegmentedOption<BoolChoice>[] = [
  { id: "yes", label: "Ja" },
  { id: "no", label: "Nein" },
  { id: "none", label: "Keine Angabe" },
];

function BoolValue({ dimension, value, onChange }: ValueFieldProps): ReactElement {
  const current: BoolChoice = value === true ? "yes" : value === false ? "no" : "none";
  return (
    <Segmented
      aria-label={dimension.label || TYPE_LABELS.bool.title}
      className="self-start"
      options={BOOL_OPTIONS}
      value={current}
      onChange={(choice) => onChange(choice === "none" ? undefined : choice === "yes")}
    />
  );
}

/** Je Punkt oder Zeile ein Eintrag; Icons gehen auch hier. */
function ListValue(props: ValueFieldProps): ReactElement {
  const { dimension, value, onChange, testId } = props;
  const icons = useFieldIcons(targetOf(props));
  const html = Array.isArray(value) ? entriesToHtml(value as string[]) : "";
  return (
    <RichTextField
      {...icons}
      aria-label={dimension.label || "Liste"}
      toolbarLabel="Liste formatieren"
      data-testid={testId}
      value={html}
      placeholder="Je Zeile ein Eintrag, z. B. Spurhalteassistent"
      onChange={(next) => {
        const entries = richEntries(next);
        onChange(entries.length === 0 ? undefined : entries);
      }}
    />
  );
}

/** Radix kennt keinen leeren Wert für eine Option. */
const NONE = "__none__";

function ChoiceValue({ dimension, value, onChange, testId }: ValueFieldProps): ReactElement {
  const options = (dimension.options ?? []).filter((option) => option.label.trim() !== "");
  if (options.length === 0) {
    return <p className="text-[13px] text-muted-foreground">Legen Sie rechts bei dieser Dimension zuerst Optionen an.</p>;
  }
  const current = typeof value === "string" && options.some((option) => option.id === value) ? value : NONE;
  return (
    <Select value={current} onValueChange={(id) => onChange(id === NONE ? undefined : id)}>
      <SelectTrigger className="w-full max-w-[320px]" data-testid={testId} aria-label={dimension.label || TYPE_LABELS.choice.title}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={NONE}>Keine Angabe</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type RatingChoice = "0" | "1" | "2" | "3" | "4" | "5";

const RATING_OPTIONS: readonly SegmentedOption<RatingChoice>[] = [
  { id: "0", label: "–" },
  ...Array.from({ length: MAX_RATING }, (_, index) => {
    const id = String(index + 1) as RatingChoice;
    return { id, label: `${"★".repeat(index + 1)}` };
  }),
];

function RatingValue({ dimension, value, onChange }: ValueFieldProps): ReactElement {
  const current = (typeof value === "number" ? String(value) : "0") as RatingChoice;
  return (
    <Segmented
      aria-label={dimension.label || TYPE_LABELS.rating.title}
      className="self-start"
      options={RATING_OPTIONS}
      value={current}
      onChange={(choice) => onChange(choice === "0" ? undefined : Number(choice))}
    />
  );
}

function GalleryValue({ dimension, itemName, value, onChange, testId }: ValueFieldProps): ReactElement {
  const images = Array.isArray(value) ? (value as GalleryImage[]) : NO_IMAGES;
  return (
    <GalleryField
      label={`${dimension.label || "Bilder"} für ${itemName || "dieses Element"}`}
      images={images}
      testId={testId}
      onChange={(next) => onChange(next.length === 0 ? undefined : next)}
    />
  );
}

const INPUTS: Record<Dimension["type"], (props: ValueFieldProps) => ReactElement> = {
  text: TextValue,
  number: NumberValue,
  bool: BoolValue,
  list: ListValue,
  choice: ChoiceValue,
  rating: RatingValue,
  gallery: GalleryValue,
};

/** Das Feld samt Beschriftung: Name der Dimension, Typ und Erläuterung als Hinweis. */
export function ValueField(props: ValueFieldProps): ReactElement {
  const { dimension } = props;
  const Control = INPUTS[dimension.type];
  const label = dimension.label.trim() === "" ? `Unbenannte Dimension (${TYPE_LABELS[dimension.type].title})` : dimension.label;
  // Pills, Auswahl und Galerie haben kein einzelnes Feld, auf das ein `<label>` zeigen könnte.
  // Pills, Auswahl, Galerie und mehrere Zahlenfelder haben kein einzelnes Feld für ein `<label>`.
  if (
    dimension.type === "bool" ||
    dimension.type === "rating" ||
    dimension.type === "gallery" ||
    dimension.type === "choice" ||
    (dimension.type === "number" && unitsOf(dimension).length >= 2)
  ) {
    return (
      <div className="flex flex-col gap-1.5" data-testid={`${props.testId}-field`}>
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
        {dimension.hint !== undefined && <span className="text-[13px] text-muted-foreground">{dimension.hint}</span>}
        <Control {...props} />
      </div>
    );
  }
  return (
    <Field label={label} hint={dimension.hint}>
      <Control {...props} />
    </Field>
  );
}
