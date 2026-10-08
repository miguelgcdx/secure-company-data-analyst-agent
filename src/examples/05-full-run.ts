import 'dotenv/config';

import {
  runSecureAnalysis,
} from '../run-secure-analysis.js';

const prompt =
  process.argv.slice(2).join(' ') ||
  [
    'Analyze sales.csv.',
    'Calculate the most important sales metrics.',
    'Identify the biggest conversion or pipeline issue.',
    'Use an analysis.mjs script for calculations.',
    'Write a detailed report.md.',
  ].join(' ');

const result =
  await runSecureAnalysis({
    // In a real API this comes from authenticated server-side tenant state,
    // never from a model tool call.
    tenantId: 'company-a',
    prompt,
  });

console.log(
  '\n--- executive response ---',
);
console.log(result.text);

console.log(
  '\n--- generated report ---',
);
console.log(
  result.report ??
    'No report was generated.',
);
