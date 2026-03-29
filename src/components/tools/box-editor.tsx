"use client";

import { ImageCanvas } from "@/components/tools/image-canvas";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord, SpritesheetBox } from "@/lib/types";

type BoxEditorProps = {
  image: ImageRecord;
  boxes: SpritesheetBox[];
  onBoxesChange: (boxes: SpritesheetBox[]) => void;
  onExtract: () => void;
  extracting: boolean;
  extracted: boolean;
};

export function BoxEditor({ image, boxes }: BoxEditorProps) {
  return (
    <ImageCanvas
      src={getImagePublicUrl(image.id)}
      alt={image.originalName}
    >
      {boxes.map((box) => (
        <div
          key={box.id}
          className="absolute border border-primary/60 bg-transparent transition-colors hover:border-primary hover:bg-primary/10"
          style={{
            left: `${(box.x / image.width) * 100}%`,
            top: `${(box.y / image.height) * 100}%`,
            width: `${(box.width / image.width) * 100}%`,
            height: `${(box.height / image.height) * 100}%`,
          }}
          title={box.label}
        />
      ))}
    </ImageCanvas>
  );
}
