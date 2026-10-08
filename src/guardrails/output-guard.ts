const secretPatterns: Array<[RegExp, string]> = [
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED_OPENAI_KEY]'],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, '[REDACTED_GITHUB_TOKEN]'],
  [
    /DATABASE_URL\s*=\s*[^\s]+/gi,
    'DATABASE_URL=[REDACTED]',
  ],
  [
    /AWS_SECRET_ACCESS_KEY\s*=\s*[^\s]+/gi,
    'AWS_SECRET_ACCESS_KEY=[REDACTED]',
  ],
];

export function guardAgentOutput(text: string) {
  // Keep unexpectedly huge model output from being forwarded downstream.
  let safe = text.slice(0, 20_000);

  // This is defense in depth. Secrets should never be placed in the sandbox
  // or model context in the first place.
  for (const [pattern, replacement] of secretPatterns) {
    safe = safe.replace(pattern, replacement);
  }

  return safe;
}
