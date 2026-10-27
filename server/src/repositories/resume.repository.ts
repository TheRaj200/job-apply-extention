import { prisma } from "../db.js";

const publicResumeFields = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  sha256: true,
  uploadedAt: true,
} as const;

export function createResume(data: {
  profileId: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  sha256: string;
}) {
  return prisma.resume.create({ data });
}

export function listResumes(profileId: string) {
  return prisma.resume.findMany({
    where: { profileId },
    select: publicResumeFields,
    orderBy: { uploadedAt: "desc" },
  });
}

export function findResume(profileId: string, id: string) {
  return prisma.resume.findFirst({
    where: { id, profileId },
  });
}

export function findResumeDetails(profileId: string, id: string) {
  return prisma.resume.findFirst({
    where: { id, profileId },
    select: publicResumeFields,
  });
}

export function deleteResume(id: string) {
  return prisma.resume.delete({ where: { id } });
}
