// Shared types used across API routes, lib/, and (eventually) the frontend.
// Keeping these in one place means the AI schema, the DB models, and the
// API responses can't quietly drift apart from each other.

export type OrderStatus =
  | 'pending_confirmation'
  | 'policy_blocked'
  | 'out_of_stock'
  | 'created'
  | 'paid'
  | 'failed';

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  ruleTriggered:
    | 'confirmation_required'
    | 'out_of_stock'
    | 'spend_cap_exceeded'
    | 'high_value_approval_required'
    | 'category_restricted'
    | 'duplicate_attempt'
    | 'ok';
}

export interface ExtractedIntent {
  category: string | null;
  maxPrice: number | null; // in rupees, not paise — converted at the DB layer
  keywords: string[];
  forBeginner: boolean | null;
}

export interface AuditEventDetail {
  [key: string]: unknown;
}
