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

/** Die linke Leiste: die verglichenen Elemente, sortierbar, mit „Neues Element“. */

import * as React from "react";
import { ReactElement } from "react";
import { useConfigShell } from "@man/config-ui/shell/shell-context";
import { ItemList, type ListItem } from "@man/config-ui/sidebar/item-list";
import { SidebarPanel } from "@man/config-ui/sidebar/sidebar-panel";
import { IconGlyph } from "@shared/icons/icon-glyph";

import { itemIssue } from "../comparison-editor-status";
import { ComparisonItem, Dimension, GalleryImage, MAX_ITEMS, normalizeValue } from "../comparison-model";

export interface ElementSidebarProps {
  items: readonly ComparisonItem[];
  dimensions: readonly Dimension[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder: (ids: string[]) => void;
}

const EMPTY_STATE = (
  <>
    Noch kein Element. Lege über <strong>Neues Element</strong> das erste an – je Element entsteht eine Spalte.
  </>
);

/** Das erste Bild des Elements aus einer Galerie, als Vorschau in der Liste. */
function firstImage(item: ComparisonItem, dimensions: readonly Dimension[]): GalleryImage | undefined {
  for (const dimension of dimensions) {
    const value = item.values[dimension.id];
    if (dimension.type === "gallery" && Array.isArray(value) && value.length > 0) return value[0] as GalleryImage;
  }
  return undefined;
}

/** Wie viele Dimensionen das Element schon belegt. */
function filled(item: ComparisonItem, dimensions: readonly Dimension[]): string {
  // Was nicht mehr passt (etwa eine gelöschte Option), zählt nicht – gespeichert würde es auch nicht.
  const count = dimensions.filter((dimension) => normalizeValue(dimension, item.values[dimension.id]) !== undefined).length;
  return dimensions.length === 0 ? "Noch keine Dimensionen" : `${count} von ${dimensions.length} Werten`;
}

function listItems(items: readonly ComparisonItem[], dimensions: readonly Dimension[], issuesVisible: boolean): ListItem[] {
  return items.map((item, index) => {
    const image = firstImage(item, dimensions);
    return {
      id: item.id,
      label: item.name.trim() === "" ? `Element ${index + 1}` : item.name,
      description: filled(item, dimensions),
      ...(image === undefined
        ? {
            icon:
              item.icon === undefined ? (
                <span className="text-[13px] font-semibold">{index + 1}</span>
              ) : (
                <IconGlyph id={item.icon} className="size-5 text-foreground" />
              ),
          }
        : { thumbnail: <img src={image.url} alt="" /> }),
      invalid: issuesVisible && itemIssue(item) !== undefined,
    };
  });
}

export function ElementSidebar({ items, dimensions, selectedId, onSelect, onAdd, onReorder }: ElementSidebarProps): ReactElement {
  const { issuesVisible } = useConfigShell();
  return (
    <SidebarPanel title="Elemente" count={items.length} max={MAX_ITEMS} addLabel="Neues Element" onAdd={onAdd}>
      <ItemList
        aria-label="Elemente"
        items={listItems(items, dimensions, issuesVisible)}
        selectedId={selectedId}
        onSelect={onSelect}
        onReorder={onReorder}
        emptyState={EMPTY_STATE}
      />
    </SidebarPanel>
  );
}
