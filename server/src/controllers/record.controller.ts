import type { Request, Response } from "express";
import {
  educationSchema,
  experienceSchema,
  idSchema,
  projectSchema,
  skillSchema,
} from "../profile.schemas.js";
import {
  createProfileRecord,
  deleteProfileRecord,
  listProfileRecords,
  updateProfileRecord,
} from "../services/record.service.js";
import type { RecordKind } from "../repositories/record.repository.js";

const definitions = {
  experiences: { kind: "experience", schema: experienceSchema },
  education: { kind: "education", schema: educationSchema },
  skills: { kind: "skill", schema: skillSchema },
  projects: { kind: "project", schema: projectSchema },
} as const satisfies Record<
  string,
  {
    kind: RecordKind;
    schema:
      | typeof experienceSchema
      | typeof educationSchema
      | typeof skillSchema
      | typeof projectSchema;
  }
>;

export function recordController(segment: keyof typeof definitions) {
  const { kind, schema } = definitions[segment];
  return {
    list: async (_request: Request, response: Response) => {
      response.json(await listProfileRecords(kind));
    },
    create: async (request: Request, response: Response) => {
      const input = schema.parse(request.body);
      response.status(201).json(await createProfileRecord(kind, input));
    },
    update: async (request: Request, response: Response) => {
      const id = idSchema.parse(request.params.id);
      const input = schema.parse(request.body);
      response.json(await updateProfileRecord(kind, id, input));
    },
    remove: async (request: Request, response: Response) => {
      const id = idSchema.parse(request.params.id);
      await deleteProfileRecord(kind, id);
      response.status(204).end();
    },
  };
}
