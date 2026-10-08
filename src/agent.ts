import 'dotenv/config';

import {
  stepCountIs,
  ToolLoopAgent,
} from 'ai';
import { ollama } from 'ollama-ai-provider-v2';

import { listWorkspaceFiles } from './tools/list-workspace-files.js';
import { readWorkspaceFile } from './tools/read-workspace-file.js';
import { runNodeScript } from './tools/run-node-script.js';
import { writeWorkspaceFile } from './tools/write-workspace-file.js';

const modelName =
  process.env.OLLAMA_MODEL?.trim() ||
  'llama3.2:3b';

export function createDataAnalystAgent(
  workspaceRoot: string,
) {
  // Tenant/workspace identity is bound by trusted application code.
  // The model never gets to choose which tenant its tools operate on.
  const toolContext = {
    workspaceRoot,
  };

  return new ToolLoopAgent({
    model: ollama(modelName),

    tools: {
      listWorkspaceFiles,
      readWorkspaceFile,
      writeWorkspaceFile,
      runNodeScript,
    },

    // contextSchema on each tool makes AI SDK validate this server-side
    // context before execution. This is different from model-generated input.
    toolsContext: {
      listWorkspaceFiles:
        toolContext,
      readWorkspaceFile:
        toolContext,
      writeWorkspaceFile:
        toolContext,
      runNodeScript:
        toolContext,
    },

    // Guardrail against an accidental endless model/tool loop.
    stopWhen: stepCountIs(12),

    // experimental_sandbox is supplied per request.
    // prepareCall lets the model know what environment it is operating in.
    prepareCall: ({
      experimental_sandbox:
        sandbox,
      ...call
    }) => ({
      ...call,

      instructions: [
        'You are a secure company data analyst.',
        'All company data must remain inside the provided sandbox.',
        'Never attempt to access paths outside the assigned workspace.',
        'You have no general shell tool.',
        'Use readWorkspaceFile to inspect data.',
        'For calculations, write a small .mjs script and execute it with runNodeScript.',
        'Write the final detailed analysis to report.md.',
        'Do not fabricate metrics. Calculate them from the provided files.',
        sandbox
          ? 'Sandbox: ' +
            sandbox.description
          : 'No sandbox is available.',
      ].join('\n'),
    }),
  });
}
