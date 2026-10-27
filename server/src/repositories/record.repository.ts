import { prisma } from "../db.js";

export type RecordKind = "experience" | "education" | "skill" | "project";

interface CrudDelegate {
  findMany(args: {
    where: { profileId: string };
    orderBy: { createdAt: "desc" };
  }): Promise<unknown[]>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  updateMany(args: {
    where: { id: string; profileId: string };
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
  findFirst(args: {
    where: { id: string; profileId: string };
  }): Promise<unknown>;
  deleteMany(args: {
    where: { id: string; profileId: string };
  }): Promise<{ count: number }>;
}

const delegates: Record<RecordKind, CrudDelegate> = {
  experience: prisma.experience as unknown as CrudDelegate,
  education: prisma.education as unknown as CrudDelegate,
  skill: prisma.skill as unknown as CrudDelegate,
  project: prisma.project as unknown as CrudDelegate,
};

export function listRecords(kind: RecordKind, profileId: string) {
  return delegates[kind].findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
  });
}

export function createRecord(
  kind: RecordKind,
  profileId: string,
  data: Record<string, unknown>,
) {
  return delegates[kind].create({
    data: { ...data, profileId },
  });
}

export async function updateRecord(
  kind: RecordKind,
  profileId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const result = await delegates[kind].updateMany({
    where: { id, profileId },
    data,
  });
  if (result.count === 0) return null;
  return delegates[kind].findFirst({ where: { id, profileId } });
}

export async function deleteRecord(
  kind: RecordKind,
  profileId: string,
  id: string,
) {
  const result = await delegates[kind].deleteMany({
    where: { id, profileId },
  });
  return result.count > 0;
}
