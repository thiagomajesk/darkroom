export type ImageSourceType = "upload" | "paste" | "url" | "generated";

export type SpritesheetBox = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridParams = {
  rows: number;
  cols: number;
  offsetX: number;
  offsetY: number;
  cellWidth: number;
  cellHeight: number;
  paddingX: number;
  paddingY: number;
};

export type ImageClassification = {
  objectDescription: string;
  artStyleDescription: string;
  tags: string[];
  reproductionPrompt: string;
};

export type ImageRecord = {
  id: string;
  sourceType: ImageSourceType;
  originalName: string;
  mimeType: string;
  filePath: string;
  width: number;
  height: number;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type CollectionRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
