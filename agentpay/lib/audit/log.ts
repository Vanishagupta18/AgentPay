import AuditLog from '../../models/AuditLog';
import type { AuditEventDetail } from '../../types';

interface WriteAuditEventInput {
  sessionId?: string;
  orderId?: string;
  eventType:
    | 'intent_extracted'
    | 'products_searched'
    | 'product_recommended'
    | 'user_confirmed'
    | 'policy_checked'
    | 'payment_created'
    | 'payment_result'
    | 'error';
  detail?: AuditEventDetail;
}

// Single choke point for every audit write, so the shape stays
// consistent and no code path forgets to log an event.
export async function writeAuditEvent(input: WriteAuditEventInput) {
  return AuditLog.create({
    sessionId: input.sessionId,
    orderId: input.orderId,
    eventType: input.eventType,
    ...input.detail,
  });
}
