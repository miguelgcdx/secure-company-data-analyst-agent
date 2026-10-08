import { posix } from 'node:path';

const SAFE_PATH = /^[a-zA-Z0-9._/-]+$/;

// Only these file types are useful for this project.
// The model cannot ask our tools to write arbitrary executables or secrets.
const WRITABLE_EXTENSIONS = new Set([
  '.csv',
  '.json',
  '.md',
  '.mjs',
  '.txt',
]);

export function assertSafeRelativePath(path: string) {
  if (!path || path.length > 180) {
    throw new Error('Invalid workspace path.');
  }

  // The model only supplies paths relative to its tenant workspace.
  // Absolute paths would let it try to address the rest of the sandbox.
  if (posix.isAbsolute(path)) {
    throw new Error('Absolute paths are not allowed.');
  }

  // Normalize first, then reject traversal.
  const normalized = posix.normalize(path);

  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error('Path traversal is not allowed.');
  }

  // Restrict characters so paths are also safe to embed in the fixed
  // commands we execute later.
  if (!SAFE_PATH.test(normalized)) {
    throw new Error('Path contains unsupported characters.');
  }

  return normalized;
}

export function assertWritablePath(path: string) {
  const normalized = assertSafeRelativePath(path);
  const extension = posix.extname(normalized);

  if (!WRITABLE_EXTENSIONS.has(extension)) {
    throw new Error(
      'This file type is not allowed in the analyst workspace.',
    );
  }

  return normalized;
}
