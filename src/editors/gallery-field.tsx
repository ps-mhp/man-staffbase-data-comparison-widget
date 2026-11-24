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
 * Die Bilder eines Elements für eine Galerie-Dimension: Reihenfolge,
 * Bildbeschreibung, Entfernen und Hinzufügen aus der Mediathek (Knopf oder
 * Kachel hierher ziehen).
 */

import * as React from "react";
import { ReactElement } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@man/config-ui/primitives/button";
import { Input } from "@man/config-ui/primitives/input";

import { PickedMedia } from "@shared/media/media-picker";

import { GalleryImage, MAX_GALLERY_IMAGES } from "../comparison-model";
import { MediaDrop, fileNameOf, imageFromPick, useEditorMedia } from "./editor-media";

export interface GalleryFieldProps {
  /** Wofür die Bilder sind, etwa „Bilder für Modell A“ – auch Titel der Mediathek-Leiste. */
  label: string;
  images: readonly GalleryImage[];
  /** Die neue Liste; leer heißt „keine Bilder“. */
  onChange: (images: GalleryImage[]) => void;
  testId: string;
}

/** Verschiebt einen Eintrag um eine Stelle; außerhalb der Liste bleibt alles, wie es ist. */
export function moveEntry<T>(entries: readonly T[], from: number, by: -1 | 1): T[] {
  const to = from + by;
  if (to < 0 || to >= entries.length) return [...entries];
  const next = [...entries];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

interface ImageRowProps {
  image: GalleryImage;
  index: number;
  total: number;
  testId: string;
  onChange: (image: GalleryImage) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}

function ImageRow({ image, index, total, testId, onChange, onMove, onRemove }: ImageRowProps): ReactElement {
  const position = `Bild ${index + 1}`;
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-background p-2" data-testid={`${testId}-${index}`}>
      <img className="h-14 w-20 shrink-0 rounded-md border bg-stage object-cover" src={image.url} alt="" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-[13px] text-muted-foreground" title={image.url}>
          {fileNameOf(image.url)}
        </span>
        <Input
          className="h-9"
          aria-label={`Bildbeschreibung ${position}`}
          placeholder="Bildbeschreibung – was ist zu sehen?"
          value={image.alt}
          data-testid={`${testId}-${index}-alt`}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
        />
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`${position} nach vorne`} disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${position} nach hinten`}
          disabled={index === total - 1}
          onClick={() => onMove(1)}
        >
          <ArrowDown aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          aria-label={`${position} entfernen`}
          data-testid={`${testId}-${index}-remove`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
}

export function GalleryField({ label, images, onChange, testId }: GalleryFieldProps): ReactElement {
  const media = useEditorMedia();
  const full = images.length >= MAX_GALLERY_IMAGES;
  // Die Leiste hält `onPick` fest: über einen Verweis schreibt sie immer an den jüngsten Stand.
  const latest = React.useRef(images);
  React.useLayoutEffect(() => {
    latest.current = images;
  }, [images]);
  const append = (picked: PickedMedia): void => {
    if (latest.current.length >= MAX_GALLERY_IMAGES) return;
    onChange([...latest.current, imageFromPick(picked)]);
  };

  return (
    <MediaDrop className="gap-3" testId={`${testId}-drop`} onPick={append}>
      {images.length > 0 ? (
        <ol className="flex flex-col gap-2" aria-label={label}>
          {images.map((image, index) => (
            <ImageRow
              key={`${index}-${image.url}`}
              image={image}
              index={index}
              total={images.length}
              testId={testId}
              onChange={(next) => onChange(images.map((entry, at) => (at === index ? next : entry)))}
              onMove={(by) => onChange(moveEntry(images, index, by))}
              onRemove={() => onChange(images.filter((_, at) => at !== index))}
            />
          ))}
        </ol>
      ) : (
        <p className="text-[13px] text-muted-foreground">Noch keine Bilder. Ohne Bilder bleibt die Zelle leer.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={full}
          data-testid={`${testId}-add`}
          onClick={() => media.pick(label, append)}
        >
          <ImagePlus aria-hidden />
          Bild hinzufügen
        </Button>
        <span className="text-[13px] text-muted-foreground">
          {full ? `Höchstens ${MAX_GALLERY_IMAGES} Bilder.` : "Oder Bilder aus der Mediathek hierher ziehen."}
        </span>
      </div>
    </MediaDrop>
  );
}
