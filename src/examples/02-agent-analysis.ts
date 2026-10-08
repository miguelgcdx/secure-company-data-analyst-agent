import 'dotenv/config';

import {
  createDataAnalystAgent,
} from '../agent.js';
import {
  createTenantSandbox,
} from '../sandbox/create-tenant-sandbox.js';

async function main() {
  const environment =
    await createTenantSandbox(
      'company-a',
    );

  try {
    const agent =
      createDataAnalystAgent(
        environment.workspaceRoot,
      );

    const result =
      await agent.generate({
        experimental_sandbox:
          environment.sandbox,

        prompt: [
          'Analyze sales.csv.',
          'Calculate win/loss counts by segment and source.',
          'Find the clearest pipeline problem.',
          'Create analysis.mjs for the calculations.',
          'Run it.',
          'Write your detailed findings to report.md.',
          'Then give me a short executive summary.',
        ].join('\n'),
      });

    console.log(
      '--- agent response ---',
    );
    console.log(result.text);

    const report =
      await environment.sandbox.readTextFile(
        {
          path:
            environment.workspaceRoot +
            '/report.md',
        },
      );

    console.log(
      '\n--- report.md ---',
    );
    console.log(report);
  } finally {
    await environment.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
