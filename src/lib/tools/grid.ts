import type { GridParams, SpritesheetBox } from "@/lib/types";

export function computeBoxesFromGrid(
  grid: GridParams,
  imageWidth: number,
  imageHeight: number,
): SpritesheetBox[] {
  const boxes: SpritesheetBox[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const x = grid.offsetX + col * (grid.cellWidth + grid.paddingX);
      const y = grid.offsetY + row * (grid.cellHeight + grid.paddingY);
      if (x + grid.cellWidth <= imageWidth && y + grid.cellHeight <= imageHeight) {
        const bx = Math.max(0, Math.min(Math.round(x), imageWidth - 1));
        const by = Math.max(0, Math.min(Math.round(y), imageHeight - 1));
        const bw = Math.max(1, Math.min(Math.round(grid.cellWidth), imageWidth - bx));
        const bh = Math.max(1, Math.min(Math.round(grid.cellHeight), imageHeight - by));
        boxes.push({
          id: crypto.randomUUID(),
          label: `sprite-${row * grid.cols + col + 1}`,
          x: bx,
          y: by,
          width: bw,
          height: bh,
        });
      }
    }
  }
  return boxes;
}
