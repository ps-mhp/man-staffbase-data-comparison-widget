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

import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stubMediaClient } from "@shared/media/media-client.testing";
import { PickedMedia } from "@shared/media/media-picker";

import { GalleryImage, MAX_GALLERY_IMAGES } from "../comparison-model";
import { EditorMediaContext, fileNameOf } from "./editor-media";
import { GalleryField, moveEntry } from "./gallery-field";

const IMAGES: GalleryImage[] = [
  { url: "https://example.com/eins.jpg", alt: "Eins" },
  { url: "https://example.com/zwei%20b.jpg?x=1", alt: "Zwei" },
];

function setup(initial: GalleryImage[]) {
  const onChange = jest.fn<void, [GalleryImage[]]>();
  let pending: ((picked: PickedMedia) => void) | undefined;
  const pick = jest.fn((_title: string, onPick: (picked: PickedMedia) => void) => {
    pending = onPick;
  });
  function Live(): React.ReactElement {
    const [images, setImages] = React.useState(initial);
    return (
      <EditorMediaContext.Provider value={{ client: stubMediaClient(), pick }}>
        <GalleryField
          label="Bilder für A"
          images={images}
          testId="g"
          onChange={(next) => {
            onChange(next);
            setImages(next);
          }}
        />
      </EditorMediaContext.Provider>
    );
  }
  render(<Live />);
  return { latest: () => onChange.mock.calls.at(-1)![0], pick, choose: (picked: PickedMedia) => pending?.(picked) };
}

describe("GalleryField", () => {
  it("zeigt Dateinamen und verschiebt Bilder", async () => {
    const h = setup(IMAGES);
    expect(screen.getByText("zwei b.jpg")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bild 2 nach vorne" }));
    expect(h.latest().map((image) => image.alt)).toEqual(["Zwei", "Eins"]);
    expect(screen.getByRole("button", { name: "Bild 1 nach vorne" })).toBeDisabled();
  });

  it("fügt ein Bild aus der Mediathek an", async () => {
    const h = setup([]);
    expect(screen.getByText(/Noch keine Bilder/)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("g-add"));
    expect(h.pick).toHaveBeenCalledWith("Bilder für A", expect.any(Function));
    React.act(() =>
      h.choose({ id: "m", url: "https://example.com/neu.jpg", fileName: "neu.jpg", kind: "image", width: 800, height: 600, alt: "Neu" }),
    );
    expect(h.latest()).toEqual([{ url: "https://example.com/neu.jpg", alt: "Neu", width: 800, height: 600 }]);
  });

  it("sperrt das Hinzufügen an der Höchstzahl", () => {
    setup(Array.from({ length: MAX_GALLERY_IMAGES }, (_, index) => ({ url: `https://example.com/${index}.jpg`, alt: "" })));
    expect(screen.getByTestId("g-add")).toBeDisabled();
    expect(screen.getByText(`Höchstens ${MAX_GALLERY_IMAGES} Bilder.`)).toBeInTheDocument();
  });
});

describe("moveEntry", () => {
  it("bleibt am Rand stehen", () => {
    expect(moveEntry([1, 2], 0, -1)).toEqual([1, 2]);
    expect(moveEntry([1, 2], 0, 1)).toEqual([2, 1]);
  });
});

describe("fileNameOf", () => {
  it("nimmt den letzten Pfadteil, entschlüsselt und übersteht Kaputtes", () => {
    expect(fileNameOf("https://a.example/x/b%20c.png?y")).toBe("b c.png");
    expect(fileNameOf("https://a.example/%E0%A4%A.png")).toBe("%E0%A4%A.png");
  });
});
