import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

export const LOCAL_PROFILE_ID = "local-user-profile";

const profileDetails = {
  experiences: true,
  education: true,
  skills: true,
  projects: true,
  preferences: true,
  resumes: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      sha256: true,
      uploadedAt: true,
    },
  },
} satisfies Prisma.ProfileInclude;

export async function findLocalProfile() {
  return prisma.profile.findUnique({
    where: { id: LOCAL_PROFILE_ID },
    include: profileDetails,
  });
}

export async function saveLocalProfile(
  profileData: Omit<Prisma.ProfileUncheckedCreateInput, "id">,
  preferences?: Omit<
    Prisma.JobPreferenceUncheckedCreateInput,
    "id" | "profileId"
  >,
) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.profile.findUnique({
      where: { id: LOCAL_PROFILE_ID },
    });
    const profile = existing
      ? await transaction.profile.update({
          where: { id: LOCAL_PROFILE_ID },
          data: profileData,
        })
      : await transaction.profile.create({
          data: { ...profileData, id: LOCAL_PROFILE_ID },
        });

    if (preferences) {
      await transaction.jobPreference.upsert({
        where: { profileId: profile.id },
        create: { ...preferences, profileId: profile.id },
        update: preferences,
      });
    }

    return transaction.profile.findUnique({
      where: { id: profile.id },
      include: profileDetails,
    });
  });
}
