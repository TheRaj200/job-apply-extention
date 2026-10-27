import type { Request, Response } from "express";
import { idSchema } from "../profile.schemas.js";
import {
  deleteProfileResume,
  downloadResume,
  getResumeDetails,
  getResumes,
  uploadResume,
} from "../services/resume.service.js";
import { UploadError } from "../storage.js";

export async function upload(request: Request, response: Response) {
  if (!request.file) {
    throw new UploadError("Attach a PDF in the 'file' field.", 400);
  }
  response
    .status(201)
    .json(
      await uploadResume(
        request.file.originalname,
        request.file.mimetype,
        request.file.buffer,
      ),
    );
}

export async function list(_request: Request, response: Response) {
  response.json(await getResumes());
}

export async function details(request: Request, response: Response) {
  const id = idSchema.parse(request.params.id);
  response.json(await getResumeDetails(id));
}

export async function download(request: Request, response: Response) {
  const id = idSchema.parse(request.params.id);
  const { resume, buffer } = await downloadResume(id);
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Length", buffer.length);
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="resume-${resume.id}.pdf"`,
  );
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.send(buffer);
}

export async function remove(request: Request, response: Response) {
  const id = idSchema.parse(request.params.id);
  await deleteProfileResume(id);
  response.status(204).end();
}
