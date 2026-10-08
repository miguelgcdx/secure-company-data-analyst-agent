import { tool } from 'ai';
import { z } from 'zod';

import { workspaceContextSchema } from './context.js';

export const listWorkspaceFiles = tool({
  description:
    'List files available in the current company analysis workspace.',

  inputSchema: z.object({}),

  contextSchema:
    workspaceContextSchema,

  execute: async (
    _input,
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

    // The command itself is fixed by our application.
    // The model cannot inject arbitrary shell syntax here.
    const result = await sandbox.run({
      command:
        'find . -maxdepth 2 -type f -print',
      workingDirectory:
        context.workspaceRoot,
      abortSignal,
    });

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return {
      files: result.stdout
        .split('\n')
        .map((file) =>
          file.replace(/^\.\//, ''),
        )
        .filter(Boolean),
    };
  },
});
