import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { profileSchema } from "../profile.schemas.js";
import {
  findLocalProfile,
  saveLocalProfile,
} from "../repositories/profile.repository.js";
import { UploadError } from "../storage.js";

function withoutUndefined<T extends object>(input: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export function getProfile() {
  return findLocalProfile();
}

export function updateProfile(input: z.infer<typeof profileSchema>) {
  const { preferences, ...profileFields } = input;
  const profileData = withoutUndefined(profileFields) as unknown as Omit<
    Prisma.ProfileUncheckedCreateInput,
    "id"
  >;
  const preferenceData = preferences
    ? (withoutUndefined(preferences) as unknown as Omit<
        Prisma.JobPreferenceUncheckedCreateInput,
        "id" | "profileId"
      >)
    : undefined;

  return saveLocalProfile(profileData, preferenceData);
}

export async function getProfileForRecords() {
  const profile = await getProfile();
  if (!profile) {
    throw new UploadError("Create a profile before adding records.", 404);
  }
  return profile;
}
