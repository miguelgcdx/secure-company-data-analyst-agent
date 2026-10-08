export type AuditEvent = {
  tenantId: string;
  action: string;
  detail?: string;
};

export function audit(
  event: AuditEvent,
) {
  // In production this should go to an append-only audit store,
  // SIEM, or structured logging pipeline instead of console.log.
  console.log(
    JSON.stringify({
      timestamp:
        new Date().toISOString(),
      ...event,
    }),
  );
}
