# Darkroom

Darkroom is a local-first image processing toolkit for managing, transforming, and analyzing images.

## Features

- Upload, paste, or import images by URL and organize them into collections.
- Split spritesheets into individual sprites with AI-assisted grid detection.
- Classify images to generate object descriptions, art style analysis, tags, and prompts.
- Transform images into grayscale, colorshift, pixelated, or SVG traced variants.
- Crop images with a visual drag-to-select tool and aspect ratio presets.
- Upscale images with high-quality interpolation (2x, 4x, 8x).
- Scrape and download images from any webpage with dimension filters.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- SQLite via Drizzle ORM
- Sharp (image processing)
- Playwright (web scraping)

## Quick Start

Requirements:

- Node.js (current LTS recommended)
- npm

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Commands

- `npm run dev`: start the local dev server
- `npm run build`: create the production build
- `npm run lint`: run the linter
- `npm test`: run the test suite

## Project Structure

- `src/app`: Next.js App Router (pages and API routes)
- `src/components`: React components (gallery, tools, UI primitives)
- `src/lib`: Core logic (database, images, collections, settings)
- `src/lib/tools`: Tool-specific logic (AI backends, grid computation)
- `cli/tools`: CLI implementations for each tool
- `cli/shared`: Shared CLI utilities
- `tests`: Test suite
