import { Router } from "express";
import multer from "multer";
import {
  details,
  download,
  list,
  remove,
  upload,
} from "./controllers/resume.controller.js";
import { recordController } from "./controllers/record.controller.js";
import { readProfile, writeProfile } from "./controllers/profile.controller.js";
import { asyncHandler } from "./http/async-handler.js";

export const router = Router();

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get("/profile", asyncHandler(readProfile));
router.put("/profile", asyncHandler(writeProfile));

for (const segment of [
  "experiences",
  "education",
  "skills",
  "projects",
] as const) {
  const controller = recordController(segment);
  const basePath = `/profile/${segment}`;

  router.get(basePath, asyncHandler(controller.list));
  router.post(basePath, asyncHandler(controller.create));
  router.put(`${basePath}/:id`, asyncHandler(controller.update));
  router.delete(`${basePath}/:id`, asyncHandler(controller.remove));
}

router.post("/resumes/upload", uploadFile.single("file"), asyncHandler(upload));
router.get("/resumes", asyncHandler(list));
router.get("/resumes/:id/download", asyncHandler(download));
router.get("/resumes/:id", asyncHandler(details));
router.delete("/resumes/:id", asyncHandler(remove));
