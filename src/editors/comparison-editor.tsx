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
 * Der Editor im Config-Modal: links die Elemente (Spalten), in der Mitte die
 * Werte des gewählten Elements, rechts die Dimensionen (Zeilen) samt
 * Gestaltung; Desktop/Tablet/Mobil zeigen die Tabelle, wie sie auf der Seite
 * steht.
 */

import * as React from "react";
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";
import { useConfigShell } from "@man/config-ui/shell/shell-context";
import { MediaClient, createMediaClient } from "@shared/media/media-client";
import { useMediaPanel } from "@shared/media/use-media-panel";
import { useIconMasks } from "@shared/icons/use-icon-stylesheet";
import { useRichTextIcons } from "@shared/icons/use-rich-text-icons";

import { ComparisonTable } from "../comparison";
import {
  CellValue,
  ComparisonConfig,
  ComparisonItem,
  DimensionType,
  MAX_DIMENSIONS,
  MAX_ITEMS,
  changeDimensionType,
  emptyDimension,
  emptyItem,
  newId,
  setItemValue,
  usedIconIds,
} from "../comparison-model";
import { EditorIconsContext } from "./editor-icons";
import { DimensionActions, ComparisonInspector } from "./comparison-inspector";
import { EditorMedia, EditorMediaContext } from "./editor-media";
import { ElementMain } from "./element-main";
import { ElementSidebar } from "./element-sidebar";
import { moveEntry } from "./gallery-field";

/** Die Einträge in der Reihenfolge der Kennungen; Unbekanntes fällt weg, Fehlendes bleibt hinten. */
export function orderById<T extends { id: string }>(entries: readonly T[], ids: readonly string[]): T[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const ordered = ids.flatMap((id) => byId.get(id) ?? []);
  const placed = new Set(ids);
  return [...ordered, ...entries.filter((entry) => !placed.has(entry.id))];
}

export interface ComparisonEditorProps {
  value: ComparisonConfig;
  onChange: (config: ComparisonConfig) => void;
  /** Für Tests; sonst die Mediathek der Instanz. */
  mediaClient?: MediaClient;
}

type Update = (change: (config: ComparisonConfig) => ComparisonConfig) => void;

/**
 * Änderungen immer am jüngsten Stand: die Mediathek-Leiste hält ihren
 * Rückruf beim Öffnen fest und schriebe sonst über inzwischen Getipptes.
 */
function useUpdate(value: ComparisonConfig, onChange: (config: ComparisonConfig) => void): Update {
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  return useCallback(
    (change) => {
      const next = change(latest.current);
      if (next === latest.current) return;
      latest.current = next;
      onChange(next);
    },
    [onChange],
  );
}

/** Die Auswahl hält sich an die Kennung; fällt das Element weg, rückt der Nachbar nach. */
function useSelection(items: readonly ComparisonItem[]) {
  const [selection, setSelection] = useState<{ id: string | null; index: number }>({ id: items[0]?.id ?? null, index: 0 });
  const found = items.findIndex((item) => item.id === selection.id);
  // Die Stelle wandert mit, wenn das Element verschoben wird – sonst rückte nach dem Löschen der falsche Nachbar nach.
  useEffect(() => {
    if (found >= 0 && found !== selection.index) setSelection((current) => ({ ...current, index: found }));
  }, [found, selection.index]);
  const index = found >= 0 ? found : items.length === 0 ? -1 : Math.min(Math.max(selection.index, 0), items.length - 1);
  const select = useCallback((id: string, at: number): void => setSelection({ id, index: at }), []);
  return { index, item: index >= 0 ? items[index] : undefined, select };
}

const mapItem = (config: ComparisonConfig, id: string, change: (item: ComparisonItem) => ComparisonItem): ComparisonConfig => ({
  ...config,
  items: config.items.map((item) => (item.id === id ? change(item) : item)),
});

function useDimensionActions(update: Update): DimensionActions {
  return useMemo<DimensionActions>(() => {
    let added: string | undefined;
    return {
      add: () => {
        added = undefined;
        update((config) => {
          if (config.dimensions.length >= MAX_DIMENSIONS) return config;
          const fresh = emptyDimension();
          added = fresh.id;
          return { ...config, dimensions: [...config.dimensions, fresh] };
        });
        return added;
      },
      change: (dimension) =>
        update((config) => ({ ...config, dimensions: config.dimensions.map((entry) => (entry.id === dimension.id ? dimension : entry)) })),
      changeType: (id: string, type: DimensionType) => update((config) => changeDimensionType(config, id, type)),
      move: (id, by) =>
        update((config) => {
          const at = config.dimensions.findIndex((entry) => entry.id === id);
          return at < 0 ? config : { ...config, dimensions: moveEntry(config.dimensions, at, by) };
        }),
      remove: (id) =>
        update((config) => ({
          ...config,
          dimensions: config.dimensions.filter((entry) => entry.id !== id),
          // Die Werte gehen mit; sonst tauchten sie bei gleicher Kennung wieder auf.
          items: config.items.map((item) => setItemValue(item, id, undefined)),
        })),
    };
  }, [update]);
}

function PreviewStage({ value }: { value: ComparisonConfig }): ReactElement {
  return (
    // `inert`: die Vorschau ist zum Ansehen da, nicht zum Bedienen.
    <div inert data-testid="cmp-preview" className="p-6">
      {value.items.length === 0 || value.dimensions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch nichts zu vergleichen. Ohne Elemente und Dimensionen erscheint der Vergleich auf der Seite nicht.
        </p>
      ) : (
        <ComparisonTable config={value} />
      )}
    </div>
  );
}

function useEditorMediaValue(mediaClient: MediaClient | undefined): { media: EditorMedia; overlay: React.ReactNode } {
  const client = useMemo(() => mediaClient ?? createMediaClient(), [mediaClient]);
  const panel = useMediaPanel(client);
  const { openMedia } = panel;
  const media = useMemo<EditorMedia>(() => ({ client, pick: (title, onPick) => openMedia({ title, onSelect: onPick }) }), [client, openMedia]);
  return { media, overlay: panel.overlay };
}

export function ComparisonEditor({ value, onChange, mediaClient }: ComparisonEditorProps): ReactElement {
  const { issuesVisible } = useConfigShell();
  const update = useUpdate(value, onChange);
  const { media, overlay } = useEditorMediaValue(mediaClient);
  const { items, dimensions } = value;
  const { index, item, select } = useSelection(items);
  const full = items.length >= MAX_ITEMS;
  const dimensionActions = useDimensionActions(update);
  const richTextIcons = useRichTextIcons();
  // Die Zeichnungen der Icons in den Textfeldern; die Vorschau lädt ihre selbst.
  const iconCss = useIconMasks(usedIconIds(value));

  const add = (): void => {
    if (full) return;
    const fresh = emptyItem();
    // Die Grenze auch am jüngsten Stand: zwei schnelle Klicks sähen sonst beide „noch Platz“.
    update((config) => (config.items.length >= MAX_ITEMS ? config : { ...config, items: [...config.items, fresh] }));
    select(fresh.id, items.length);
  };
  const duplicate = (): void => {
    if (item === undefined || full) return;
    const copy: ComparisonItem = { ...item, id: newId(), name: item.name === "" ? "" : `${item.name} (Kopie)` };
    update((config) => {
      const at = config.items.findIndex((entry) => entry.id === item.id);
      if (at < 0 || config.items.length >= MAX_ITEMS) return config;
      return { ...config, items: [...config.items.slice(0, at + 1), copy, ...config.items.slice(at + 1)] };
    });
    select(copy.id, index + 1);
  };
  const remove = (): void => {
    if (item === undefined) return;
    update((config) => ({ ...config, items: config.items.filter((entry) => entry.id !== item.id) }));
  };
  const setValue = (dimensionId: string, next: CellValue | undefined): void => {
    if (item === undefined) return;
    const id = item.id;
    update((config) => mapItem(config, id, (entry) => setItemValue(entry, dimensionId, next)));
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col" data-testid="cmp-editor">
      <style>{iconCss}</style>
      <EditorIconsContext.Provider value={richTextIcons}>
      <EditorMediaContext.Provider value={media}>
        <ConfigWorkspace
          className="flex-1"
          sidebar={
            <ElementSidebar
              items={items}
              dimensions={dimensions}
              selectedId={item?.id}
              onSelect={(id) => select(id, items.findIndex((entry) => entry.id === id))}
              onAdd={add}
              onReorder={(ids) => update((config) => ({ ...config, items: orderById(config.items, ids) }))}
            />
          }
          inspector={
            <ComparisonInspector
              value={value}
              onSettings={(patch) => update((config) => ({ ...config, ...patch }))}
              dimensions={dimensionActions}
            />
          }
          preview={<PreviewStage value={value} />}
        >
          <ElementMain
            item={item}
            dimensions={dimensions}
            position={index}
            total={items.length}
            full={full}
            issuesVisible={issuesVisible}
            onRename={({ name, subtitle }) => {
              if (item === undefined) return;
              const id = item.id;
              update((config) =>
                mapItem(config, id, (entry) => {
                  const { subtitle: _dropped, ...rest } = entry;
                  void _dropped;
                  return subtitle === undefined || subtitle === "" ? { ...rest, name } : { ...rest, name, subtitle };
                }),
              );
            }}
            onIcon={(icon) => {
              if (item === undefined) return;
              const id = item.id;
              update((config) =>
                mapItem(config, id, (entry) => {
                  const { icon: _dropped, ...rest } = entry;
                  void _dropped;
                  return icon === undefined ? rest : { ...rest, icon };
                }),
              );
            }}
            onValue={setValue}
            onMove={(by) =>
              update((config) => {
                const at = config.items.findIndex((entry) => entry.id === item?.id);
                return at < 0 ? config : { ...config, items: moveEntry(config.items, at, by) };
              })
            }
            onDuplicate={duplicate}
            onRemove={remove}
          />
        </ConfigWorkspace>
      </EditorMediaContext.Provider>
      </EditorIconsContext.Provider>
      {overlay}
    </div>
  );
}
