import { classifyImage } from "../../shared/ai-backend";

export async function classifyImageCli(input: string) {
  const result = await classifyImage(input);
  console.log(JSON.stringify(result));
}
