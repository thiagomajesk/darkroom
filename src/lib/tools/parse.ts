import type { GridParams } from "@/lib/types";

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const jsonObj = text.match(/\{[\s\S]*\}/);
  if (jsonObj) return jsonObj[0];

  return text;
}

export function parseGridResult(finalResponse: string): GridParams {
  const json = extractJson(finalResponse);
  return JSON.parse(json) as GridParams;
}
