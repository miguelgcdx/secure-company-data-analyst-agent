import { tool } from 'ai';
import { z } from 'zod';

import {
  assertSafeRelativePath,
} from '../guardrails/path-guard.js';
import { workspaceContextSchema } from './context.js';

export const readWorkspaceFile = tool({
  description:
    'Read a UTF-8 file from the current company analysis workspace.',

  inputSchema: z.object({
    path: z.string(),
  }),

  contextSchema:
    workspaceContextSchema,

  execute: async (
    { path },
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

    // Path guardrail blocks absolute paths and ../ traversal
    // before the sandbox API sees the model-generated path.
    const safePath =
      assertSafeRelativePath(path);

    const content =
      await sandbox.readTextFile({
        path:
          context.workspaceRoot +
          '/' +
          safePath,
        abortSignal,
      });

    if (content == null) {
      throw new Error(
        'File does not exist.',
      );
    }

    // Avoid returning huge files directly into model context.
    return {
      content: content.slice(0, 50_000),
      truncated:
        content.length > 50_000,
    };
  },
});
