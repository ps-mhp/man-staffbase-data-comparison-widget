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
 * Wie hoch der Rahmen einer Galerie ist: so hoch, dass das höchste Bild der
 * ganzen Zeile vollständig zu sehen ist. Bei gleicher Breite ist das das Bild
 * mit dem kleinsten Seitenverhältnis (Breite ÷ Höhe). Alle Zellen der Zeile
 * teilen es – so bleiben sie bündig, und beim Blättern springt nichts.
 *
 * Maße kommen aus der Mediathek (`width`/`height`); fehlen sie, misst der
 * Browser das Bild nach.
 */

import { useEffect, useMemo, useState } from "react";

import { GalleryImage } from "./comparison-model";

/** Bis die Maße da sind; danach das des höchsten Bildes. */
export const FALLBACK_RATIO = 4 / 3;

/** Grenzen gegen Ausreißer: ein Panorama soll keine Briefmarke, ein Streifen keinen Turm ergeben. */
export const MIN_RATIO = 0.5;
export const MAX_RATIO = 3;

const ratioOf = (width: number | undefined, height: number | undefined): number | undefined =>
  width !== undefined && height !== undefined && width > 0 && height > 0 ? width / height : undefined;

/** Das Verhältnis für den Rahmen: das kleinste bekannte, begrenzt; ohne Maße die Vorgabe. */
export function frameRatio(ratios: readonly (number | undefined)[]): number {
  const known = ratios.filter((ratio): ratio is number => ratio !== undefined && Number.isFinite(ratio) && ratio > 0);
  if (known.length === 0) return FALLBACK_RATIO;
  return Math.min(Math.max(Math.min(...known), MIN_RATIO), MAX_RATIO);
}

/** Misst Bilder ohne Maße nach; jede Adresse einmal. */
function useMeasuredRatios(urls: readonly string[]): ReadonlyMap<string, number> {
  const [measured, setMeasured] = useState<ReadonlyMap<string, number>>(new Map());
  const key = urls.join("\n");
  useEffect(() => {
    if (key === "" || typeof Image === "undefined") return;
    let live = true;
    key.split("\n").forEach((url) => {
      const probe = new Image();
      probe.onload = () => {
        const ratio = ratioOf(probe.naturalWidth, probe.naturalHeight);
        if (live && ratio !== undefined) setMeasured((previous) => new Map(previous).set(url, ratio));
      };
      probe.src = url;
    });
    return () => {
      live = false;
    };
  }, [key]);
  return measured;
}

/** Das Seitenverhältnis des Rahmens für alle Bilder einer Galerie-Zeile. */
export function useGalleryRatio(images: readonly GalleryImage[]): number {
  const unknown = useMemo(
    () => [...new Set(images.filter((image) => ratioOf(image.width, image.height) === undefined).map((image) => image.url))],
    [images],
  );
  const measured = useMeasuredRatios(unknown);
  return frameRatio(images.map((image) => ratioOf(image.width, image.height) ?? measured.get(image.url)));
}
