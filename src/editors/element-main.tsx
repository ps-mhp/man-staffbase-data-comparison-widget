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

/** Die Mitte: Name des gewählten Elements und sein Wert zu jeder Dimension. */

import * as React from "react";
import { ReactElement } from "react";
import { Field } from "@man/config-ui/form/field";
import { FormSection } from "@man/config-ui/form/form-section";
import { Note } from "@man/config-ui/form/note";
import { Input } from "@man/config-ui/primitives/input";
import { ItemActions } from "@man/config-ui/sidebar/item-actions";
import { IconField } from "@shared/icons/icon-field";

import { itemIssue } from "../comparison-editor-status";
import { CellValue, ComparisonItem, Dimension } from "../comparison-model";
import { ValueField } from "./value-field";

export interface ElementMainProps {
  item: ComparisonItem | undefined;
  dimensions: readonly Dimension[];
  position: number;
  total: number;
  full: boolean;
  /** Ob „Übernehmen“ schon an Fehlern scheiterte; erst dann zeigen Felder ihre. */
  issuesVisible: boolean;
  onRename: (patch: Pick<ComparisonItem, "name"> & { subtitle?: string }) => void;
  onIcon: (icon: string | undefined) => void;
  onValue: (dimensionId: string, value: CellValue | undefined) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function ElementMain({
  item,
  dimensions,
  position,
  total,
  full,
  issuesVisible,
  onRename,
  onIcon,
  onValue,
  onMove,
  onDuplicate,
  onRemove,
}: ElementMainProps): ReactElement {
  if (item === undefined) {
    return (
      <p className="px-10 py-6 text-sm text-muted-foreground max-lg:px-6">
        Hier stehen die Werte des gewählten Elements. Legen Sie links das erste Element an.
      </p>
    );
  }
  const testId = `cmp-item-${position}`;
  const nameError = issuesVisible ? itemIssue(item) : undefined;

  return (
    <div className="px-10 pt-6 pb-12 max-lg:px-6" data-testid={testId}>
      <div className="flex max-w-[720px] flex-col gap-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold text-foreground">{`Element ${position + 1} von ${total}`}</h2>
          <ItemActions
            className="ml-auto"
            noun="Element"
            orientation="horizontal"
            onMoveBack={() => onMove(-1)}
            onMoveForward={() => onMove(1)}
            canMoveBack={position > 0}
            canMoveForward={position < total - 1}
            onDuplicate={onDuplicate}
            canDuplicate={!full}
            onDelete={onRemove}
          />
        </div>

        <FormSection title="Spaltenkopf">
          <Field label="Name" required error={nameError === undefined ? undefined : "Der Name steht über der Spalte."}>
            <Input
              data-testid={`${testId}-name`}
              value={item.name}
              placeholder="z. B. TGX 18.510"
              onChange={(event) => onRename({ name: event.target.value, subtitle: item.subtitle })}
            />
          </Field>
          <Field label="Untertitel" hint="Optional, eine Zeile unter dem Namen.">
            <Input
              data-testid={`${testId}-subtitle`}
              value={item.subtitle ?? ""}
              placeholder="z. B. Fernverkehr"
              onChange={(event) => onRename({ name: item.name, subtitle: event.target.value })}
            />
          </Field>
          <IconField
            // Je Element ein eigenes Feld: die offene Auswahl gehört nicht zum nächsten.
            key={item.id}
            label="Icon über dem Namen"
            title={`Icon für ${item.name || `Element ${position + 1}`}`}
            value={item.icon}
            data-testid={`${testId}-icon`}
            onChange={onIcon}
          />
        </FormSection>

        <FormSection title="Werte" aside={dimensions.length === 0 ? undefined : `${dimensions.length} Dimensionen`}>
          {dimensions.length === 0 ? (
            <Note>Noch keine Dimensionen. Legen Sie rechts unter „Dimensionen“ fest, was verglichen wird.</Note>
          ) : (
            dimensions.map((dimension) => (
              <ValueField
                // Je Element und Dimension ein eigenes Feld: Rohtext gehört nicht zum nächsten Element.
                key={`${item.id}:${dimension.id}:${dimension.type}`}
                dimension={dimension}
                itemName={item.name}
                value={item.values[dimension.id]}
                testId={`${testId}-value-${dimension.id}`}
                onChange={(value) => onValue(dimension.id, value)}
              />
            ))
          )}
        </FormSection>
      </div>
    </div>
  );
}
