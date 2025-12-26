import { z } from 'zod';
import { insertUserSettingsSchema, insertWorkoutSchema, userSettings, workouts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  user: {
    getSettings: {
      method: 'GET' as const,
      path: '/api/user/settings',
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateSettings: {
      method: 'POST' as const,
      path: '/api/user/settings',
      input: insertUserSettingsSchema,
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workouts: {
    list: {
      method: 'GET' as const,
      path: '/api/workouts',
      responses: {
        200: z.array(z.custom<typeof workouts.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/workouts/generate',
      input: z.object({
        muscleGroup: z.string(),
      }),
      responses: {
        200: z.custom<typeof workouts.$inferSelect>(),
        400: errorSchemas.validation,
        402: z.object({ message: z.string() }), // Payment required
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/workouts/:id/complete',
      responses: {
        200: z.custom<typeof workouts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  qa: {
    ask: {
      method: 'POST' as const,
      path: '/api/qa/ask',
      input: z.object({
        question: z.string().min(1),
      }),
      responses: {
        200: z.object({
          answer: z.string(),
          sources: z.array(z.string()).optional(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
