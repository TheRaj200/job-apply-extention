import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { app } from "./app.js";
import { prisma } from "./db.js";
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  skillSchema,
} from "./profile.schemas.js";
import {
  loadPdf,
  MAX_RESUME_BYTES,
  removePdf,
  storePdf,
  UploadError,
} from "./storage.js";

const pdf = Buffer.from("%PDF-1.7\n% test PDF body\n%%EOF");

describe("career profile validation", () => {
  it("accepts profile and preference data and rejects malformed email", () => {
    expect(
      profileSchema.parse({
        fullName: "Test Person",
        email: "test@example.local",
        preferences: {
          jobTitles: ["Engineer"],
          preferredLocations: ["Local"],
          workArrangement: "remote",
        },
      }).fullName,
    ).toBe("Test Person");
    expect(
      profileSchema.safeParse({ fullName: "Test", email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("validates each profile record type", () => {
    expect(
      experienceSchema.safeParse({
        company: "Example",
        title: "Engineer",
        startDate: "2020-01-01",
      }).success,
    ).toBe(true);
    expect(
      educationSchema.safeParse({ institution: "Example University" }).success,
    ).toBe(true);
    expect(
      skillSchema.safeParse({ name: "TypeScript", category: "technical" })
        .success,
    ).toBe(true);
    expect(
      projectSchema.safeParse({
        name: "Project",
        description: "Built it",
        technologies: ["TypeScript"],
      }).success,
    ).toBe(true);
    expect(
      skillSchema.safeParse({ name: "", category: "unknown" }).success,
    ).toBe(false);
  });
});

describe("private local PDF storage", () => {
  let directory: string;

  afterEach(async () => {
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it("stores and downloads a PDF using an opaque key and checksum metadata", async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "job-agent-test-"));
    const metadata = await storePdf(directory, pdf, "application/pdf");
    expect(metadata.storageKey).toMatch(/^[0-9a-f-]{36}\.pdf$/i);
    expect(metadata.sha256).toHaveLength(64);
    expect(await loadPdf(directory, metadata.storageKey)).toEqual(pdf);
    await removePdf(directory, metadata.storageKey);
    await expect(loadPdf(directory, metadata.storageKey)).rejects.toMatchObject(
      { statusCode: 404 },
    );
  });

  it("rejects invalid MIME type, signature, oversized data, and traversal keys", async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "job-agent-test-"));
    await expect(storePdf(directory, pdf, "text/plain")).rejects.toBeInstanceOf(
      UploadError,
    );
    await expect(
      storePdf(directory, Buffer.from("not a PDF"), "application/pdf"),
    ).rejects.toMatchObject({ statusCode: 415 });
    await expect(
      storePdf(
        directory,
        Buffer.alloc(MAX_RESUME_BYTES + 1),
        "application/pdf",
      ),
    ).rejects.toMatchObject({ statusCode: 413 });
    await expect(loadPdf(directory, "../secret.pdf")).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(
      loadPdf(directory, `${"a".repeat(36)}.pdf`),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("profile API boundaries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects invalid profile payloads before touching the database", async () => {
    const response = await request(app)
      .put("/api/v1/profile")
      .send({ fullName: "", email: "bad" });
    expect(response.status).toBe(400);
  });

  it("maps known database conflicts to a safe client error", async () => {
    vi.spyOn(prisma, "$transaction").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const response = await request(app)
      .put("/api/v1/profile")
      .send({ fullName: "Test", email: "test@example.local" });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "Conflicting or missing record." });
  });
});
