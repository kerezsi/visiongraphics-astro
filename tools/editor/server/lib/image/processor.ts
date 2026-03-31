import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { PROJECT_ROOT, validatePath } from '../fs-utils.js';
import { buildImageDir, buildImageUrl, sanitizeFilename } from './path-builder.js';
import type { PageType } from './path-builder.js';

export interface ProcessResult {
  outputPath: string;
  width: number;
  height: number;
  url: string;
  filename: string;
}

const MAX_WIDTH = 2400;
const JPEG_QUALITY = 88;

export async function processImage(
  buffer: Buffer,
  originalName: string,
  pageType: PageType,
  slug: string
): Promise<ProcessResult> {
  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  const hasAlpha =
    metadata.hasAlpha === true &&
    (metadata.format === 'png' || metadata.format === 'gif' || metadata.format === 'webp');

  // Build output filename
  const sanitized = sanitizeFilename(originalName);
  const baseName = sanitized.slice(0, sanitized.lastIndexOf('.') !== -1 ? sanitized.lastIndexOf('.') : sanitized.length);
  const outputExt = hasAlpha ? '.webp' : '.jpg';
  const outputFilename = baseName + outputExt;

  // Resize pipeline
  let pipeline = sharpInstance.resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
    fit: 'inside',
  });

  if (hasAlpha) {
    pipeline = pipeline.webp({ quality: JPEG_QUALITY }) as typeof pipeline;
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }) as typeof pipeline;
  }

  const outputBuffer = await pipeline.toBuffer({ resolveWithObject: true });

  // Determine output directory and path
  const imageDir = buildImageDir(pageType, slug);
  const safeDirPath = validatePath(imageDir);
  await fs.mkdir(safeDirPath, { recursive: true });

  const outputFilePath = path.join(safeDirPath, outputFilename);
  await fs.writeFile(outputFilePath, outputBuffer.data);

  const url = buildImageUrl(pageType, slug, outputFilename);

  return {
    outputPath: outputFilePath,
    width: outputBuffer.info.width,
    height: outputBuffer.info.height,
    url,
    filename: outputFilename,
  };
}
