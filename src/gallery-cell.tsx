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
 * Die Galerie in einer Zelle: ein Bild, Pfeile zum Blättern, ein Knopf zum
 * Vergrößern. Vergrößert öffnet ein `<dialog>` als Modal — es liegt in der
 * obersten Ebene des Browsers, also über Staffbases Kopfleiste und außerhalb
 * jedes `overflow: hidden` der Tabelle, auch aus einem Shadow Root heraus.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

import { GalleryImage } from "./comparison-model";
import { FALLBACK_RATIO } from "./gallery-ratio";

export const GALLERY_LABELS = {
  previous: "Vorheriges Bild",
  next: "Nächstes Bild",
  enlarge: "Bild vergrößern",
  close: "Schließen",
  position: (index: number, total: number): string => `Bild ${index + 1} von ${total}`,
} as const;

/** Schmale Striche statt Icon-Schrift: das Bündel der Leseseite bleibt klein. */
function Glyph({ path }: { path: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

const PATH_PREVIOUS = "M15 5l-7 7 7 7";
const PATH_NEXT = "M9 5l7 7-7 7";
/** Das „[ ]“: vier Ecken eines Rahmens. */
const PATH_ENLARGE = "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5";
const PATH_CLOSE = "M6 6l12 12M18 6L6 18";

const wrap = (index: number, total: number): number => (total === 0 ? 0 : (index + total) % total);

interface PagerProps {
  total: number;
  onStep: (by: -1 | 1) => void;
  className: string;
}

function Pager({ total, onStep, className }: PagerProps): React.ReactElement | null {
  if (total < 2) return null;
  return (
    <>
      <button type="button" className={`${className} ${className}--prev`} aria-label={GALLERY_LABELS.previous} onClick={() => onStep(-1)}>
        <Glyph path={PATH_PREVIOUS} />
      </button>
      <button type="button" className={`${className} ${className}--next`} aria-label={GALLERY_LABELS.next} onClick={() => onStep(1)}>
        <Glyph path={PATH_NEXT} />
      </button>
    </>
  );
}

function Counter({ index, total, className }: { index: number; total: number; className: string }): React.ReactElement | null {
  if (total < 2) return null;
  // Sichtbar „2 / 5“, vorgelesen „Bild 2 von 5“: `aria-label` an einem Span ohne Rolle überhören die meisten Leser.
  return (
    <span className={className} role="status">
      <span aria-hidden="true">{`${index + 1} / ${total}`}</span>
      <span className="man-cmp__sr">{GALLERY_LABELS.position(index, total)}</span>
    </span>
  );
}

/** Die Bildbeschreibung, sonst wessen Bild an welcher Stelle — ein Bild ohne Namen wäre für Screenreader unsichtbar. */
const altOf = (image: GalleryImage, label: string, index: number, total: number): string =>
  image.alt !== "" ? image.alt : `${label} – ${GALLERY_LABELS.position(index, total)}`;

/** Öffnet das `<dialog>` als Modal; jsdom und alte Browser kennen `showModal` nicht. */
function openDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

interface LightboxProps {
  images: readonly GalleryImage[];
  index: number;
  label: string;
  open: boolean;
  onStep: (by: -1 | 1) => void;
  onClose: () => void;
}

function Lightbox({ images, index, label, open, onStep, onClose }: LightboxProps): React.ReactElement {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open) {
      openDialog(dialog);
      // Der Fokus gehört ins Fenster, damit Pfeiltasten und Esc dort ankommen.
      closeRef.current?.focus();
    } else if (dialog.open) closeDialog(dialog);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === "ArrowLeft") onStep(-1);
    else if (event.key === "ArrowRight") onStep(1);
    else return;
    event.preventDefault();
  };

  return (
    <dialog
      ref={ref}
      className="man-cmp-lightbox"
      aria-label={label}
      // Esc schließt das Modal schon selbst; `close` hält den Zustand nach.
      onClose={onClose}
      onKeyDown={onKeyDown}
      // Ein Klick neben das Bild, also auf den Hintergrund, schließt.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Geschlossen bleibt das Fenster leer: kein zweites großes Bild im Dokument. */}
      {open && image !== undefined && (
        <>
          <figure className="man-cmp-lightbox__figure">
            <img className="man-cmp-lightbox__image" src={image.url} alt={altOf(image, label, index, images.length)} />
            {image.alt !== "" && <figcaption className="man-cmp-lightbox__caption">{image.alt}</figcaption>}
          </figure>
          <Pager total={images.length} onStep={onStep} className="man-cmp-lightbox__nav" />
          <Counter index={index} total={images.length} className="man-cmp-lightbox__count" />
          <button ref={closeRef} type="button" className="man-cmp-lightbox__close" aria-label={GALLERY_LABELS.close} onClick={onClose}>
            <Glyph path={PATH_CLOSE} />
          </button>
        </>
      )}
    </dialog>
  );
}

export interface GalleryCellProps {
  images: readonly GalleryImage[];
  /**
   * Breite ÷ Höhe des Rahmens – das des höchsten Bildes der Zeile
   * (`useGalleryRatio`), damit jedes Bild in voller Höhe zu sehen ist.
   */
  ratio?: number;
  /** Wessen Bilder das sind, etwa „TGX 18.510“ — Name des vergrößerten Fensters. */
  label: string;
}

export function GalleryCell({ images, label, ratio = FALLBACK_RATIO }: GalleryCellProps): React.ReactElement | null {
  const [index, setIndex] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const enlargeRef = useRef<HTMLButtonElement>(null);
  const total = images.length;
  // Wird die Galerie kürzer (Editor), bleibt der Zeiger im Bereich.
  const current = Math.min(index, Math.max(total - 1, 0));
  const step = useCallback((by: -1 | 1) => setIndex((previous) => wrap(Math.min(previous, total - 1) + by, total)), [total]);
  const image = images[current];
  if (image === undefined) return null;

  return (
    <div className="man-cmp-gallery" data-testid="cmp-gallery">
      <div className="man-cmp-gallery__frame" style={{ aspectRatio: String(ratio) }}>
        <img className="man-cmp-gallery__image" src={image.url} alt={altOf(image, label, current, total)} loading="lazy" />
      </div>
      <Pager total={total} onStep={step} className="man-cmp-gallery__nav" />
      <Counter index={current} total={total} className="man-cmp-gallery__count" />
      <button
        ref={enlargeRef}
        type="button"
        className="man-cmp-gallery__enlarge"
        aria-label={GALLERY_LABELS.enlarge}
        aria-haspopup="dialog"
        onClick={() => setEnlarged(true)}
      >
        <Glyph path={PATH_ENLARGE} />
      </button>
      <Lightbox
        images={images}
        index={current}
        label={label}
        open={enlarged}
        onStep={step}
        onClose={() => {
          setEnlarged(false);
          // Safari fokussiert Knöpfe beim Klick nicht; ohne das landete der Fokus nach dem Schließen auf der Seite.
          enlargeRef.current?.focus();
        }}
      />
    </div>
  );
}
