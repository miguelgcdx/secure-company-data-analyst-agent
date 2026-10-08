import { tool } from 'ai';
import { z } from 'zod';

import {
  assertWritablePath,
} from '../guardrails/path-guard.js';
import { workspaceContextSchema } from './context.js';

export const writeWorkspaceFile = tool({
  description:
    'Write an analysis script, report, JSON, CSV, or text file inside the current company workspace.',

  inputSchema: z.object({
    path: z.string(),
    content: z
      .string()
      .max(200_000),
  }),

  contextSchema:
    workspaceContextSchema,

  execute: async (
    { path, content },
    {
      context,
      abortSignal,
      experimental_sandbox: sandbox,
    },
  ) => {
    if (!sandbox) {
      throw new Error(
        'Sandbox is not available.',
      );
    }

    const safePath =
      assertWritablePath(path);

    await sandbox.writeTextFile({
      path:
        context.workspaceRoot +
        '/' +
        safePath,
      content,
      abortSignal,
    });

    return {
      ok: true,
      path: safePath,
    };
  },
});
