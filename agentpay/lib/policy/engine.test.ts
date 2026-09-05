import { describe, it, expect } from 'vitest';
import { evaluatePurchase, type PolicyInput } from './engine';

const basePreferences: PolicyInput['preferences'] = {
  maximumPurchaseAmount: 500000, // ₹5,000
  requireConfirmation: true,
  highValueApprovalThreshold: 300000, // ₹3,000
};

function makeInput(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    amount: 250000, // ₹2,500 — under every threshold by default
    category: 'footwear',
    stock: 5,
    isActive: true,
    userConfirmed: true,
    isDuplicateAttempt: false,
    preferences: basePreferences,
    ...overrides,
  };
}

describe('policy engine', () => {
  it('allows a normal purchase within all limits', () => {
    const result = evaluatePurchase(makeInput());
    expect(result.allowed).toBe(true);
    expect(result.ruleTriggered).toBe('ok');
  });

  it('blocks when the user has not confirmed', () => {
    const result = evaluatePurchase(makeInput({ userConfirmed: false }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('confirmation_required');
  });

  it('blocks when the product is out of stock', () => {
    const result = evaluatePurchase(makeInput({ stock: 0 }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('out_of_stock');
  });

  it('blocks when the product is inactive even if stock is positive', () => {
    const result = evaluatePurchase(makeInput({ isActive: false, stock: 10 }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('out_of_stock');
  });

  it('blocks when amount exceeds the spend cap', () => {
    const result = evaluatePurchase(makeInput({ amount: 600000 }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('spend_cap_exceeded');
  });

  it('requires high-value approval between the two thresholds', () => {
    const result = evaluatePurchase(makeInput({ amount: 400000 })); // between 3k and 5k
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('high_value_approval_required');
  });

  it('allows a high-value purchase once explicitly approved', () => {
    const result = evaluatePurchase(
      makeInput({
        amount: 400000,
        preferences: { ...basePreferences, highValueApproved: true },
      })
    );
    expect(result.allowed).toBe(true);
  });

  it('blocks restricted categories', () => {
    const result = evaluatePurchase(makeInput({ category: 'firearms', blockedCategories: ['firearms'] }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('category_restricted');
  });

  it('treats a duplicate attempt as blocked regardless of other conditions', () => {
    const result = evaluatePurchase(makeInput({ isDuplicateAttempt: true, userConfirmed: false }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('duplicate_attempt');
  });

  it('never allows spend-cap and high-value logic to contradict each other', () => {
    // amount right at the spend cap boundary should still be evaluated
    // by the spend-cap rule, not silently fall through
    const result = evaluatePurchase(makeInput({ amount: 500001 }));
    expect(result.allowed).toBe(false);
    expect(result.ruleTriggered).toBe('spend_cap_exceeded');
  });
});
