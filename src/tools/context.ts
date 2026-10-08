import { z } from 'zod';

// The model does NOT generate this value.
// Our server binds the tenant workspace to each tool through toolsContext.
export const workspaceContextSchema =
  z.object({
    workspaceRoot: z.string(),
  });
