import { z } from 'zod';

const requestSchema = z
  .string()
  .trim()
  .min(3)
  .max(4_000);

// These deterministic checks are one guardrail layer.
// In production they should be combined with authorization, tenant scoping,
// tool permissions, sandbox policy, and possibly a dedicated safety classifier.
const blockedPatterns: RegExp[] = [
  /\/etc\/passwd/i,
  /\.ssh\//i,
  /database_url/i,
  /aws_secret_access_key/i,
  /steal.*secret/i,
  /exfiltrat/i,
  /upload.*(?:customer|company|sales).*external/i,
  /send.*data.*(?:unknown|external).*server/i,
];

export function validateUserRequest(input: string) {
  const request = requestSchema.parse(input);

  for (const pattern of blockedPatterns) {
    if (pattern.test(request)) {
      throw new Error(
        'The request violates the data-analysis security policy.',
      );
    }
  }

  return request;
}
