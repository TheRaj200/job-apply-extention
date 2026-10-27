import {
  createRecord,
  deleteRecord,
  listRecords,
  type RecordKind,
  updateRecord,
} from "../repositories/record.repository.js";
import { UploadError } from "../storage.js";
import { getProfileForRecords } from "./profile.service.js";

export async function listProfileRecords(kind: RecordKind) {
  const profile = await getProfileForRecords();
  return listRecords(kind, profile.id);
}

export async function createProfileRecord(
  kind: RecordKind,
  data: Record<string, unknown>,
) {
  const profile = await getProfileForRecords();
  return createRecord(kind, profile.id, data);
}

export async function updateProfileRecord(
  kind: RecordKind,
  id: string,
  data: Record<string, unknown>,
) {
  const profile = await getProfileForRecords();
  const record = await updateRecord(kind, profile.id, id, data);
  if (!record) throw new UploadError("Record not found.", 404);
  return record;
}

export async function deleteProfileRecord(kind: RecordKind, id: string) {
  const profile = await getProfileForRecords();
  const deleted = await deleteRecord(kind, profile.id, id);
  if (!deleted) throw new UploadError("Record not found.", 404);
}
