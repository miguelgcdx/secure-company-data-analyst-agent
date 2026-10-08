import {
  createDataAnalystAgent,
} from './agent.js';
import {
  validateUserRequest,
} from './guardrails/input-guard.js';
import {
  guardAgentOutput,
} from './guardrails/output-guard.js';
import {
  createTenantSandbox,
} from './sandbox/create-tenant-sandbox.js';
import { audit } from './security/audit.js';

export async function runSecureAnalysis({
  tenantId,
  prompt,
}: {
  tenantId: string;
  prompt: string;
}) {
  // Input guardrail runs before we spend model or sandbox resources.
  const safePrompt =
    validateUserRequest(prompt);

  audit({
    tenantId,
    action:
      'analysis.request.accepted',
  });

  const environment =
    await createTenantSandbox(
      tenantId,
    );

  try {
    const agent =
      createDataAnalystAgent(
        environment.workspaceRoot,
      );

    // The restricted sandbox is available to tool execute() callbacks
    // through their experimental_sandbox execution option.
    const result =
      await agent.generate({
        prompt: safePrompt,
        experimental_sandbox:
          environment.sandbox,
      });

    const text =
      guardAgentOutput(
        result.text,
      );

    // report.md is an artifact created inside the isolated tenant workspace.
    const report =
      await environment.sandbox.readTextFile(
        {
          path:
            environment.workspaceRoot +
            '/report.md',
        },
      );

    audit({
      tenantId,
      action:
        'analysis.completed',
      detail:
        'finishReason=' +
        result.finishReason,
    });

    return {
      text,
      report:
        report == null
          ? null
          : guardAgentOutput(
              report,
            ),
      finishReason:
        result.finishReason,
      usage: result.usage,
    };
  } catch (error) {
    audit({
      tenantId,
      action:
        'analysis.failed',
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });

    throw error;
  } finally {
    // Sandboxes should have an explicit lifecycle.
    // Company files disappear with this ephemeral analysis environment.
    await environment.destroy();

    audit({
      tenantId,
      action:
        'sandbox.destroyed',
    });
  }
}
