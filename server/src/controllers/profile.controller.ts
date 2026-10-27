import type { Request, Response } from "express";
import { profileSchema } from "../profile.schemas.js";
import { getProfile, updateProfile } from "../services/profile.service.js";

export async function readProfile(_request: Request, response: Response) {
  response.json(await getProfile());
}

export async function writeProfile(request: Request, response: Response) {
  const input = profileSchema.parse(request.body);
  response.json(await updateProfile(input));
}
