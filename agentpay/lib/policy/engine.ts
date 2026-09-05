import type { PolicyDecision } from '../../types';

// Deterministic. No LLM calls anywhere in this file, on purpose. The AI
// recommends what to buy; this file decides whether the purchase is
// actually allowed to execute. It should be boring enough to explain
// line-by-line in an interview, and it's the one file with a real unit
// test — see engine.test.ts.

export interface PolicyInput {
  amount: number; // paise, server-fetched — never trust a client-supplied amount
  category: string;
  stock: number;
  isActive: boolean;
  userConfirmed: boolean;
  isDuplicateAttempt: boolean;
  preferences: {
    maximumPurchaseAmount: number;
    requireConfirmation: boolean;
    highValueApprovalThreshold: number;
    highValueApproved?: boolean; // set true only if the user explicitly cleared a second confirmation step
  };
  blockedCategories?: string[];
}

export function evaluatePurchase(input: PolicyInput): PolicyDecision {
  const { amount, category, stock, isActive, userConfirmed, isDuplicateAttempt, preferences } = input;
  const blockedCategories = input.blockedCategories ?? [];

  if (isDuplicateAttempt) {
    return {
      allowed: false,
      reason: 'This checkout attempt was already processed — returning the existing result instead of creating a duplicate order.',
      ruleTriggered: 'duplicate_attempt',
    };
  }

  if (preferences.requireConfirmation && !userConfirmed) {
    return {
      allowed: false,
      reason: 'Awaiting explicit user confirmation before spending money.',
      ruleTriggered: 'confirmation_required',
    };
  }

  if (!isActive || stock <= 0) {
    return {
      allowed: false,
      reason: 'Product is out of stock or no longer active — cannot fulfil this purchase.',
      ruleTriggered: 'out_of_stock',
    };
  }

  if (amount > preferences.maximumPurchaseAmount) {
    return {
      allowed: false,
      reason: `Amount ₹${(amount / 100).toFixed(2)} exceeds the configured spending limit of ₹${(preferences.maximumPurchaseAmount / 100).toFixed(2)}.`,
      ruleTriggered: 'spend_cap_exceeded',
    };
  }

  if (amount > preferences.highValueApprovalThreshold && !preferences.highValueApproved) {
    return {
      allowed: false,
      reason: `Amount ₹${(amount / 100).toFixed(2)} exceeds the high-value threshold of ₹${(preferences.highValueApprovalThreshold / 100).toFixed(2)} and needs a second explicit confirmation.`,
      ruleTriggered: 'high_value_approval_required',
    };
  }

  if (blockedCategories.includes(category)) {
    return {
      allowed: false,
      reason: `Category '${category}' is restricted and requires human approval.`,
      ruleTriggered: 'category_restricted',
    };
  }

  return { allowed: true, reason: 'Within policy limits.', ruleTriggered: 'ok' };
}
