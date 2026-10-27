import { z } from "zod";

const optionalText = z.string().trim().max(10000).optional().nullable();
const optionalUrl = z.string().url().optional().nullable();
const date = z.coerce.date();

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().email().max(320),
  phone: optionalText,
  location: optionalText,
  headline: optionalText,
  summary: optionalText,
  portfolioUrl: optionalUrl,
  linkedInUrl: optionalUrl,
  preferences: z
    .object({
      jobTitles: z.array(z.string().trim().min(1).max(150)).max(50),
      preferredLocations: z.array(z.string().trim().min(1).max(150)).max(50),
      workArrangement: z.enum(["remote", "hybrid", "on-site", "any"]),
      salaryMin: z.number().int().nonnegative().optional().nullable(),
      salaryMax: z.number().int().nonnegative().optional().nullable(),
      currency: z.string().length(3).default("USD"),
    })
    .optional(),
});

export const experienceSchema = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  location: optionalText,
  startDate: date,
  endDate: date.optional().nullable(),
  current: z.boolean().default(false),
  description: z.string().trim().max(10000).default(""),
  achievements: z
    .array(z.string().trim().min(1).max(2000))
    .max(100)
    .default([]),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: optionalText,
  field: optionalText,
  location: optionalText,
  startDate: date.optional().nullable(),
  endDate: date.optional().nullable(),
  description: optionalText,
});

export const skillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.enum(["technical", "soft"]),
  verified: z.boolean().default(false),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  technologies: z.array(z.string().trim().min(1).max(100)).max(100),
  projectUrl: optionalUrl,
  achievements: z
    .array(z.string().trim().min(1).max(2000))
    .max(100)
    .default([]),
});

export const idSchema = z.string().cuid();
