import {
  createVercelNetworkSandboxSession,
} from '@ai-sdk/sandbox-vercel';

import { sampleSalesCsv } from '../data/sample-sales.js';

const TENANT_ID = /^[a-z0-9][a-z0-9_-]{1,62}$/;

export async function createTenantSandbox(
  tenantId: string,
) {
  if (!TENANT_ID.test(tenantId)) {
    throw new Error('Invalid tenant id.');
  }

  // This is a real isolated Vercel Sandbox, not the host Node.js process.
  const networkSandbox =
    await createVercelNetworkSandboxSession({
      runtime: 'node24',
      timeout: 5 * 60 * 1000,
    });

  // Network guardrail:
  // analysis code can work with files but cannot send company data
  // to arbitrary external hosts.
  await networkSandbox.setNetworkPolicy({
    mode: 'deny-all',
  });

  // restricted() removes lifecycle/network-policy powers from the object
  // that we pass into AI SDK tools.
  const sandbox = networkSandbox.restricted();

  // Each tenant gets its own directory even though this demo already creates
  // a separate sandbox per request. This gives us defense in depth.
  const workspaceRoot =
    'workspace/' + tenantId;

  await sandbox.run({
    command:
      'mkdir -p ' + workspaceRoot,
  });

  await sandbox.writeTextFile({
    path:
      workspaceRoot + '/sales.csv',
    content: sampleSalesCsv,
  });

  return {
    networkSandbox,
    sandbox,
    workspaceRoot,

    async destroy() {
      await networkSandbox.destroy();
    },
  };
}
