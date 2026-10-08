import { tool } from 'ai';
import { z } from 'zod';

import {
  assertSafeRelativePath,
} from '../guardrails/path-guard.js';
import { workspaceContextSchema } from './context.js';

export const runNodeScript = tool({
  description:
    'Run a previously created .mjs analysis script inside the isolated workspace.',

  inputSchema: z.object({
    scriptPath: z.string(),
  }),

  contextSchema:
    workspaceContextSchema,

  execute: async (
    { scriptPath },
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
      assertSafeRelativePath(
        scriptPath,
      );

    if (!safePath.endsWith('.mjs')) {
      throw new Error(
        'Only .mjs analysis scripts can be executed.',
      );
    }

    // Command guardrail:
    // the model chooses only the validated file path.
    // It does NOT receive a generic "run any shell command" capability.
    const command =
      'node ' + safePath;

    // Time limit prevents an analysis script from running forever.
    const timeoutSignal =
      AbortSignal.timeout(15_000);

    const signal = abortSignal
      ? AbortSignal.any([
          abortSignal,
          timeoutSignal,
        ])
      : timeoutSignal;

    const result = await sandbox.run({
      command,
      workingDirectory:
        context.workspaceRoot,
      abortSignal: signal,
    });

    return {
      exitCode: result.exitCode,

      // Bound tool output before it enters model context.
      stdout:
        result.stdout.slice(
          0,
          20_000,
        ),

      stderr:
        result.stderr.slice(
          0,
          10_000,
        ),
    };
  },
});
