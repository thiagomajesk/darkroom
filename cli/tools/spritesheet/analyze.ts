import { analyzeSpritesheet } from "../../shared/ai-backend";

export async function inspectSpritesheetCli(input: string) {
  const result = await analyzeSpritesheet(input);
  console.log(JSON.stringify(result));
}
