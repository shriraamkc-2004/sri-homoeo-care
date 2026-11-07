/**
 * AiSOC Audit Telemetry & OCSF-Normalized Security Logger
 * Records governance, clinical events, and sensitive data access
 */

export type AuditCategory = "authentication" | "clinical_record" | "prescription" | "dispatch" | "governance";

export interface OcsfAuditEvent {
  timestamp: string;
  category: AuditCategory;
  action: string;
  actor: {
    id?: string;
    role?: string;
    identifier?: string;
    ipAddress?: string;
  };
  resource?: {
    type: string;
    id: string;
  };
  status: "success" | "failure" | "denied";
  details?: Record<string, unknown>;
}

export function logAuditEvent(event: Omit<OcsfAuditEvent, "timestamp">): void {
  const fullEvent: OcsfAuditEvent = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Structured output for production logging (stdout / log shipper / AiSOC ingest)
  const line = `[AiSOC_AUDIT] ${JSON.stringify(fullEvent)}`;
  if (fullEvent.status === "failure" || fullEvent.status === "denied") {
    console.warn(line);
  } else {
    console.info(line);
  }
}
