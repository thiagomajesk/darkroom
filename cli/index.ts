/**
 * CLI module public API.
 *
 * All CLI tool functions should be imported from this file,
 * not from internal implementation files directly.
 */

export { cropImage } from "./tools/crop/crop";
export { scrapeImages, type ScrapedImage } from "./tools/scraper/scrape";
export { grayscale } from "./tools/synthesize/grayscale";
export { colorshift } from "./tools/synthesize/colorshift";
export { pixelate } from "./tools/synthesize/pixelate";
export { svgTrace } from "./tools/synthesize/svg-trace";
export { upscale } from "./tools/synthesize/upscale";
export { extractSpritesCli } from "./tools/spritesheet/extract";
