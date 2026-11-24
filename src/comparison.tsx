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
 * Der Datenvergleich: eine Tabelle mit den Dimensionen in der ersten Spalte,
 * die beim waagerechten Scrollen stehen bleibt, und je Element eine Spalte.
 */

import React, { useEffect, useRef, useState } from "react";

import { useHotStyle } from "@shared/hot-style";
import { useIconMasks } from "@shared/icons/use-icon-stylesheet";
import { bestItemIds, cellValue, formatNumber, isComparable, rowDiffers, rowHasValues } from "./comparison-logic";
import {
  ComparisonConfig,
  ComparisonItem,
  Dimension,
  GalleryImage,
  MAX_RATING,
  boolIcons,
  hasContent,
  usedIconIds,
} from "./comparison-model";
import { GalleryCell } from "./gallery-cell";
import { useGalleryRatio } from "./gallery-ratio";
import { richEntries, sanitizeTextValue } from "./rich-values";
import comparisonCss from "./styles/comparison.scss";

export const COMPARISON_WIDGET_TAG = "data-comparison-widget";

export const COMPARISON_LABELS = {
  dimensionColumn: "Merkmal",
  scroller: "Vergleichstabelle, waagerecht scrollbar",
  empty: "keine Angabe",
  yes: "Ja",
  no: "Nein",
  best: "Bestwert",
  differencesOnly: "Nur Unterschiede",
  noDifferences: "Die Elemente unterscheiden sich in keinem Merkmal.",
  rating: (value: number): string => `${value} von ${MAX_RATING}`,
} as const;

/** Die Sprache der Seite, für Zahlen in ihrer Schreibweise. */
const pageLocale = (): string | undefined =>
  typeof document === "undefined" ? undefined : document.documentElement.lang || undefined;

/**
 * Ein Icon der Bibliothek als Maske in Schriftfarbe (`useIconMasks` liefert
 * die Zeichnungen); Größe und Farbe kommen vom umgebenden Element.
 * Schmückend: die Bedeutung trägt der Text daneben.
 */
function Icon({ id, className }: { id: string; className: string }): React.ReactElement {
  return <span className={`man-cmp__icon ${className}`} data-man-icon={id} aria-hidden="true" />;
}

function Empty(): React.ReactElement {
  return (
    <span className="man-cmp__empty">
      <span aria-hidden="true">–</span>
      <span className="man-cmp__sr">{COMPARISON_LABELS.empty}</span>
    </span>
  );
}

function BoolValue({ value, dimension }: { value: boolean; dimension: Dimension }): React.ReactElement {
  const { yes, no } = boolIcons(dimension);
  const color = value ? dimension.yesColor : dimension.noColor;
  // Als Variable, nicht als `color`: abgeblendete Zeilen dürfen sie weiter übersteuern.
  const style = color === undefined ? undefined : ({ "--cmp-bool-color": color } as React.CSSProperties);
  return (
    <span className={value ? "man-cmp__bool man-cmp__bool--yes" : "man-cmp__bool man-cmp__bool--no"} style={style}>
      <Icon id={value ? yes : no} className="man-cmp__bool-mark" />
      <span className="man-cmp__sr">{value ? COMPARISON_LABELS.yes : COMPARISON_LABELS.no}</span>
    </span>
  );
}

function RatingValue({ value }: { value: number }): React.ReactElement {
  return (
    <span className="man-cmp__rating" role="img" aria-label={COMPARISON_LABELS.rating(value)}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <span key={index} className={index < value ? "man-cmp__star man-cmp__star--on" : "man-cmp__star"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

interface CellContentProps {
  item: ComparisonItem;
  dimension: Dimension;
  /** Rahmen der Galerie-Zeile, siehe `useGalleryRatio`. */
  galleryRatio: number;
}

function CellContent({ item, dimension, galleryRatio }: CellContentProps): React.ReactElement | null {
  const value = cellValue(item, dimension);
  if (value === undefined) return <Empty />;
  switch (dimension.type) {
    case "text":
      // Bereinigt (Absätze, Aufzählungen, Icons) – hier noch einmal, denn es wird Markup.
      return <div className="man-cmp__text" dangerouslySetInnerHTML={{ __html: sanitizeTextValue(value as string) }} />;
    case "number":
      return <span className="man-cmp__number">{formatNumber(value as number, dimension.unit, pageLocale())}</span>;
    case "bool":
      return <BoolValue value={value as boolean} dimension={dimension} />;
    case "list":
      return (
        <ul className="man-cmp__list">
          {(value as string[]).flatMap(richEntries).map((entry, index) => (
            // Bereinigte Zeile: Text und Icons.
            <li className="man-cmp__list-item" key={`${index}-${entry}`} dangerouslySetInnerHTML={{ __html: entry }} />
          ))}
        </ul>
      );
    case "choice": {
      const option = dimension.options?.find((entry) => entry.id === value);
      return option === undefined ? <Empty /> : <span className="man-cmp__choice">{option.label}</span>;
    }
    case "rating":
      return <RatingValue value={value as number} />;
    case "gallery":
      return <GalleryCell images={value as GalleryImage[]} label={`${dimension.label}: ${item.name}`} ratio={galleryRatio} />;
  }
}

const NO_IMAGES: readonly GalleryImage[] = [];

function BestBadge(): React.ReactElement {
  return <span className="man-cmp__best">{COMPARISON_LABELS.best}</span>;
}

interface RowProps {
  dimension: Dimension;
  items: readonly ComparisonItem[];
  config: ComparisonConfig;
}

function Row({ dimension, items, config }: RowProps): React.ReactElement {
  const differs = rowDiffers(items, dimension);
  const best = config.markBest ? bestItemIds(items, dimension) : new Set<string>();
  // Alle Bilder der Zeile: der Rahmen richtet sich nach dem höchsten.
  const galleryRatio = useGalleryRatio(
    dimension.type === "gallery" ? items.flatMap((item) => (cellValue(item, dimension) as GalleryImage[] | undefined) ?? []) : NO_IMAGES,
  );
  // Abgeblendet wird nur, was vergleicht und gleich ist — nie die Galerie.
  const muted = config.highlightDifferences && isComparable(dimension) && items.length > 1 && !differs;
  const rowClass = [
    "man-cmp__row",
    `man-cmp__row--${dimension.type}`,
    muted ? "man-cmp__row--same" : "",
    differs ? "man-cmp__row--differs" : "",
  ]
    .filter((part) => part !== "")
    .join(" ");

  return (
    <tr className={rowClass} data-testid={`cmp-row-${dimension.id}`}>
      <th scope="row" className="man-cmp__dim">
        <span className="man-cmp__dim-label">
          {dimension.icon !== undefined && <Icon id={dimension.icon} className="man-cmp__dim-icon" />}
          {dimension.label}
        </span>
        {dimension.hint !== undefined && <span className="man-cmp__dim-hint">{dimension.hint}</span>}
      </th>
      {items.map((item) => (
        <td key={item.id} className={best.has(item.id) ? "man-cmp__cell man-cmp__cell--best" : "man-cmp__cell"}>
          <CellContent item={item} dimension={dimension} galleryRatio={galleryRatio} />
          {best.has(item.id) && <BestBadge />}
        </td>
      ))}
    </tr>
  );
}

function DifferenceToggle({ pressed, onToggle }: { pressed: boolean; onToggle: () => void }): React.ReactElement {
  return (
    <button type="button" className="man-cmp__toggle" aria-pressed={pressed} onClick={onToggle} data-testid="cmp-difference-toggle">
      <span className="man-cmp__toggle-track" aria-hidden="true">
        <span className="man-cmp__toggle-thumb" />
      </span>
      {COMPARISON_LABELS.differencesOnly}
    </button>
  );
}

/** Die Zeilen, die erscheinen: ohne leere, auf Wunsch nur mit Unterschied (Bilder bleiben). */
export function visibleDimensions(config: ComparisonConfig, differencesOnly: boolean): Dimension[] {
  return config.dimensions.filter((dimension) => {
    if (!rowHasValues(config.items, dimension)) return false;
    if (!differencesOnly || !isComparable(dimension)) return true;
    return rowDiffers(config.items, dimension);
  });
}

/** Darunter rückt die Tabelle enger zusammen (`data-narrow` im Stylesheet). */
export const NARROW_WIDTH = 560;

/**
 * Ob der Vergleich selbst schmal ist — gemessen an der eigenen Breite, nicht
 * am Fenster: in einer Spalte oder der Mobil-Vorschau des Editors ist er
 * schmal, auch wenn das Fenster breit ist.
 */
function useNarrow(): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setNarrow(entry.contentRect.width > 0 && entry.contentRect.width < NARROW_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  });
  return [ref, narrow];
}

export interface ComparisonTableProps {
  config: ComparisonConfig;
}

export function ComparisonTable({ config }: ComparisonTableProps): React.ReactElement | null {
  const liveCss = useHotStyle(comparisonCss, COMPARISON_WIDGET_TAG, "styles/comparison.scss");
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [rootRef, narrow] = useNarrow();
  // Nur die Zeichnungen, die der Vergleich zeigt; nachgeladen, erst wenn es Icons gibt.
  const iconCss = useIconMasks(hasContent(config) ? usedIconIds(config) : []);

  if (!hasContent(config)) return null;

  const filterOn = config.differenceToggle && differencesOnly;
  const dimensions = visibleDimensions(config, filterOn);
  const heading = config.heading.trim();
  const showHead = heading !== "" || config.differenceToggle;
  const nothingDiffers = filterOn && dimensions.every((dimension) => !isComparable(dimension));

  return (
    <section
      ref={rootRef}
      className="man-cmp"
      data-accent={config.accent}
      data-narrow={narrow ? "" : undefined}
      data-testid="cmp-widget"
    >
      <style>{`${liveCss}\n${iconCss}`}</style>
      {showHead && (
        <div className="man-cmp__head">
          {heading !== "" && <h3 className="man-cmp__heading">{heading}</h3>}
          {config.differenceToggle && (
            <DifferenceToggle pressed={differencesOnly} onToggle={() => setDifferencesOnly((value) => !value)} />
          )}
        </div>
      )}
      <div
        className="man-cmp__scroller"
        data-scrolled={scrolled ? "" : undefined}
        role="region"
        aria-label={COMPARISON_LABELS.scroller}
        // Fokussierbar, damit sich die Tabelle auch mit Pfeiltasten schieben lässt.
        tabIndex={0}
        onScroll={(event) => setScrolled(event.currentTarget.scrollLeft > 0)}
      >
        <table className="man-cmp__table" style={{ "--cmp-columns": config.items.length } as React.CSSProperties}>
          {heading !== "" && <caption className="man-cmp__sr">{heading}</caption>}
          <thead>
            <tr className="man-cmp__header-row">
              <th scope="col" className="man-cmp__corner">
                <span className="man-cmp__sr">{COMPARISON_LABELS.dimensionColumn}</span>
              </th>
              {config.items.map((item) => (
                <th key={item.id} scope="col" className="man-cmp__item">
                  {item.icon !== undefined && <Icon id={item.icon} className="man-cmp__item-icon" />}
                  <span className="man-cmp__item-name">{item.name}</span>
                  {item.subtitle !== undefined && <span className="man-cmp__item-subtitle">{item.subtitle}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dimension) => (
              <Row key={dimension.id} dimension={dimension} items={config.items} config={config} />
            ))}
          </tbody>
        </table>
      </div>
      {nothingDiffers && <p className="man-cmp__note">{COMPARISON_LABELS.noDifferences}</p>}
    </section>
  );
}
