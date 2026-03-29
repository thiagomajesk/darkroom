import { chromium } from "playwright";

export type ScrapedImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export async function scrapeImages(
  url: string,
  _filters?: {
    minWidth?: number;
    minHeight?: number;
    fileTypes?: string[];
  },
): Promise<ScrapedImage[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "load", timeout: 20000 });

    // Wait for JS to render + scroll to trigger lazy loading
    await page.waitForTimeout(3000);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const images = await page.evaluate(() => {
      const results: { url: string; alt: string; width?: number; height?: number }[] = [];
      const seen = new Set<string>();

      document.querySelectorAll("img").forEach((img) => {
        const src = img.src || img.getAttribute("data-src") || "";
        if (src && !src.startsWith("data:") && !seen.has(src)) {
          seen.add(src);
          results.push({
            url: src,
            alt: img.alt || "",
            width: img.naturalWidth || undefined,
            height: img.naturalHeight || undefined,
          });
        }
      });

      document.querySelectorAll("source[srcset]").forEach((source) => {
        const srcset = source.getAttribute("srcset") || "";
        const firstUrl = srcset.split(",")[0]?.trim().split(/\s+/)[0];
        if (firstUrl && !firstUrl.startsWith("data:") && !seen.has(firstUrl)) {
          seen.add(firstUrl);
          results.push({ url: firstUrl, alt: "" });
        }
      });

      return results;
    });

    await context.close();
    return images;
  } finally {
    await browser.close();
  }
}
