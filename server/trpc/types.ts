import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  photoURL: z.string(),
  totalScore: z.number(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileBasicSchema = z.object({
  id: z.string(),
  username: z.string(),
  photoURL: z.string(),
});
export type ProfileBasic = z.infer<typeof ProfileBasicSchema>;

export const FlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  lastRun: z.string().optional(),
  url: z.string().url(),
});
export type Flow = z.infer<typeof FlowSchema>;

export const AgentActionSchema = z.object({
  type: z.enum([
    'moveCursor',
    'click',
    'type',
    'scroll',
    'wait',
    'pressKey',
    'screenshot',
    'finish',
    'fail',
  ]),
  details: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      text: z.string().optional(),
      key: z.string().optional(),
      duration: z.number().optional(),
      elementDescription: z.string().optional(),
      reason: z.string().optional(),
    })
    .optional(),
  rationale: z.string().optional(),
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const AgentThoughtSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestamp: z.number(),
  type: z.enum(['observation', 'plan', 'action', 'error']),
});
export type AgentThought = z.infer<typeof AgentThoughtSchema>;

export const FlowResultSchema = z.object({
  flowId: z.string(),
  success: z.boolean(),
  actions: z.array(AgentActionSchema),
  thoughts: z.array(AgentThoughtSchema),
  screenshots: z.array(z.string()), // base64 images
  duration: z.number(),
  errors: z.array(z.string()).optional(),
});
export type FlowResult = z.infer<typeof FlowResultSchema>;
