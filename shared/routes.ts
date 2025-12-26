import { z } from 'zod';
import { insertUserSettingsSchema, insertWorkoutSchema, userSettings, workouts, insertGymSchema } from './schema';

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
  unauthorized: z.object({
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
  admin: {
    gyms: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/gyms',
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/gyms',
        input: insertGymSchema,
      },
      update: {
        method: 'PATCH' as const,
        path: '/api/admin/gyms/:id',
        input: insertGymSchema.partial(),
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/gyms/:id',
      },
    },
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/users',
      },
      approve: {
        method: 'POST' as const,
        path: '/api/admin/users/:id/approve',
        input: z.object({
          accessLevel: z.enum(['total', 'partial']),
          aiChatEnabled: z.boolean().optional(),
        }),
      },
      reject: {
        method: 'POST' as const,
        path: '/api/admin/users/:id/reject',
      },
      block: {
        method: 'POST' as const,
        path: '/api/admin/users/:id/block',
      },
      updateAccess: {
        method: 'PATCH' as const,
        path: '/api/admin/users/:id/access',
        input: z.object({
          accessLevel: z.enum(['total', 'partial']).optional(),
          aiChatEnabled: z.boolean().optional(),
        }),
      },
    },
    dashboard: {
      stats: {
        method: 'GET' as const,
        path: '/api/admin/dashboard/stats',
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
