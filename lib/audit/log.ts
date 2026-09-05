import AuditLog from '../../models/AuditLog';

interface WriteAuditEventInput {
  sessionId?: string;
  orderId?: string;
  eventType:
    | 'agent_request' | 'intent_extracted' | 'product_recommended' | 'purchase_confirmed'
    | 'policy_checked' | 'policy_blocked' | 'payment_created' | 'payment_success'
    | 'payment_failed' | 'payment_verified' | 'order_created' | 'order_completed';
  actor?: 'user' | 'ai' | 'policy_engine' | 'payment_provider' | 'system';
  input?: unknown;
  decision?: unknown;
  reason?: string;
  metadata?: unknown;
}

export async function writeAuditEvent(input: WriteAuditEventInput) {
  return AuditLog.create({
    sessionId: input.sessionId,
    orderId: input.orderId,
    eventType: input.eventType,
    actor: input.actor ?? 'system',
    input: input.input,
    decision: input.decision,
    reason: input.reason,
    metadata: input.metadata,
  });
}
