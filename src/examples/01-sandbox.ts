import 'dotenv/config';

import {
  createTenantSandbox,
} from '../sandbox/create-tenant-sandbox.js';

async function main() {
  const environment =
    await createTenantSandbox(
      'company-a',
    );

  try {
    // Application code receives a restricted view of the sandbox.
    const files =
      await environment.sandbox.run({
        command:
          'find . -maxdepth 2 -type f -print',
        workingDirectory:
          environment.workspaceRoot,
      });

    console.log(
      '--- files ---',
    );
    console.log(files.stdout);

    const sales =
      await environment.sandbox.readTextFile(
        {
          path:
            environment.workspaceRoot +
            '/sales.csv',
          startLine: 1,
          endLine: 5,
        },
      );

    console.log(
      '--- sales.csv ---',
    );
    console.log(sales);

    // The network policy for this sandbox is deny-all.
    // This command should fail to reach the public internet.
    const networkTest =
      await environment.sandbox.run({
        command:
          "node -e \"fetch('https://example.com').then(() => console.log('unexpected')).catch(() => console.log('blocked'))\"",
      });

    console.log(
      '--- network guardrail ---',
    );
    console.log(
      networkTest.stdout.trim(),
    );
  } finally {
    await environment.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
