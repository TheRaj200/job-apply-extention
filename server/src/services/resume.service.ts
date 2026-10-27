import {
  createResume,
  deleteResume,
  findResume,
  findResumeDetails,
  listResumes,
} from "../repositories/resume.repository.js";
import { loadPdf, removePdf, storePdf, UploadError } from "../storage.js";
import { env } from "../config/env.js";
import { getProfileForRecords } from "./profile.service.js";

export async function uploadResume(
  originalName: string,
  mimeType: string,
  buffer: Buffer,
) {
  const profile = await getProfileForRecords();
  const stored = await storePdf(env.LOCAL_STORAGE_DIR, buffer, mimeType);
  try {
    return await createResume({
      ...stored,
      profileId: profile.id,
      originalName: originalName.slice(0, 255),
    });
  } catch (error) {
    await removePdf(env.LOCAL_STORAGE_DIR, stored.storageKey);
    throw error;
  }
}

export async function getResumes() {
  const profile = await getProfileForRecords();
  return listResumes(profile.id);
}

export async function getResumeDetails(id: string) {
  const profile = await getProfileForRecords();
  const resume = await findResumeDetails(profile.id, id);
  if (!resume) throw new UploadError("Resume not found.", 404);
  return resume;
}

export async function downloadResume(id: string) {
  const profile = await getProfileForRecords();
  const resume = await findResume(profile.id, id);
  if (!resume) throw new UploadError("Resume not found.", 404);
  return {
    resume,
    buffer: await loadPdf(env.LOCAL_STORAGE_DIR, resume.storageKey),
  };
}

export async function deleteProfileResume(id: string) {
  const profile = await getProfileForRecords();
  const resume = await findResume(profile.id, id);
  if (!resume) throw new UploadError("Resume not found.", 404);
  await deleteResume(resume.id);
  await removePdf(env.LOCAL_STORAGE_DIR, resume.storageKey);
}
