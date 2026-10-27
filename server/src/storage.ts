import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PDF_MIME = "application/pdf";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function storePdf(root: string, buffer: Buffer, mimeType: string) {
  if (buffer.length === 0 || buffer.length > MAX_RESUME_BYTES) {
    throw new UploadError("PDF must be between 1 byte and 5 MiB.", 413);
  }
  if (mimeType !== PDF_MIME || !isPdf(buffer)) {
    throw new UploadError("Only valid PDF files are accepted.", 415);
  }
  const key = `${randomUUID()}.pdf`;
  const absoluteRoot = path.resolve(root);
  await mkdir(absoluteRoot, { recursive: true });
  await writeFile(path.join(absoluteRoot, key), buffer, {
    flag: "wx",
    mode: 0o600,
  });
  return {
    storageKey: key,
    size: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    mimeType: PDF_MIME,
  };
}

function resolveKey(root: string, key: string): string {
  if (!/^[0-9a-f-]{36}\.pdf$/i.test(key)) {
    throw new UploadError("Invalid storage key.", 400);
  }
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, key);
  if (path.dirname(target) !== absoluteRoot) {
    throw new UploadError("Invalid storage key.", 400);
  }
  return target;
}

export async function loadPdf(root: string, key: string): Promise<Buffer> {
  try {
    return await readFile(resolveKey(root, key));
  } catch (error) {
    if (error instanceof UploadError) throw error;
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new UploadError("Resume file is missing from local storage.", 404);
    }
    throw error;
  }
}

export async function removePdf(root: string, key: string): Promise<void> {
  try {
    await rm(resolveKey(root, key));
  } catch (error) {
    if (error instanceof UploadError) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
