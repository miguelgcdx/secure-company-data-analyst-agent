import 'dotenv/config';

import {
  createTenantSandbox,
} from '../sandbox/create-tenant-sandbox.js';

async function main() {
  const companyA =
    await createTenantSandbox(
      'company-a',
    );

  const companyB =
    await createTenantSandbox(
      'company-b',
    );

  try {
    await companyA.sandbox.writeTextFile(
      {
        path:
          companyA.workspaceRoot +
          '/private-note.txt',
        content:
          'COMPANY_A_ONLY',
      },
    );

    const aNote =
      await companyA.sandbox.readTextFile(
        {
          path:
            companyA.workspaceRoot +
            '/private-note.txt',
        },
      );

    const bCannotSeeANote =
      await companyB.sandbox.readTextFile(
        {
          // Same logical filename, but inside company B's separate sandbox.
          path:
            companyB.workspaceRoot +
            '/private-note.txt',
        },
      );

    console.log({
      companyA: aNote,
      companyB:
        bCannotSeeANote,
    });

    if (
      bCannotSeeANote !== null
    ) {
      throw new Error(
        'Tenant isolation failed.',
      );
    }

    console.log(
      'PASS: company B cannot see company A files.',
    );
  } finally {
    await Promise.all([
      companyA.destroy(),
      companyB.destroy(),
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
