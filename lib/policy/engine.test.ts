import { describe, it, expect } from 'vitest';
import { evaluatePurchase, type PolicyInput } from './engine';

const baseConfig: PolicyInput['config'] = {
  confirmationRequired: true,
  maximumAmount: 500000,
  maximumQuantity: 2,
  allowedCategories: null,
};

function makeInput(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    amount: 250000, quantity: 1, category: 'footwear', stock: 5, isActive: true,
    userConfirmed: true, isDuplicateAttempt: false, config: baseConfig, ...overrides,
  };
}

describe('policy engine', () => {
  it('allows a normal purchase within all limits', () => {
    const result = evaluatePurchase(makeInput());
    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(result.checks.every((c) => c.startsWith('✓'))).toBe(true);
  });

  it('blocks when the user has not confirmed', () => {
    const result = evaluatePurchase(makeInput({ userConfirmed: false }));
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toMatch(/confirmation/i);
  });

  it('blocks when the product is out of stock', () => {
    const result = evaluatePurchase(makeInput({ stock: 0 }));
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => /stock/i.test(r))).toBe(true);
  });

  it('blocks when the product is inactive even with positive stock', () => {
    const result = evaluatePurchase(makeInput({ isActive: false, stock: 10 }));
    expect(result.allowed).toBe(false);
  });

  it('blocks when quantity exceeds the maximum', () => {
    const result = evaluatePurchase(makeInput({ quantity: 3 }));
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => /quantity/i.test(r))).toBe(true);
  });

  it('blocks when total amount (price × quantity) exceeds the spend cap', () => {
    const result = evaluatePurchase(makeInput({ amount: 300000, quantity: 2 }));
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => /spending limit/i.test(r))).toBe(true);
  });

  it('allows exactly at the spend cap boundary', () => {
    const result = evaluatePurchase(makeInput({ amount: 500000, quantity: 1 }));
    expect(result.allowed).toBe(true);
  });

  it('blocks a category not in the allowed list', () => {
    const result = evaluatePurchase(makeInput({ category: 'restricted', config: { ...baseConfig, allowedCategories: ['footwear'] } }));
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => /category/i.test(r))).toBe(true);
  });

  it('allows any category when allowedCategories is null', () => {
    const result = evaluatePurchase(makeInput({ category: 'anything' }));
    expect(result.allowed).toBe(true);
  });

  it('treats a duplicate attempt as blocked and skips other checks', () => {
    const result = evaluatePurchase(makeInput({ isDuplicateAttempt: true, userConfirmed: false, stock: 0 }));
    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toMatch(/duplicate/i);
  });

  it('accumulates multiple failure reasons when several checks fail at once', () => {
    const result = evaluatePurchase(makeInput({ userConfirmed: false, stock: 0, quantity: 5 }));
    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it('always returns one check entry per rule, regardless of outcome', () => {
    const result = evaluatePurchase(makeInput());
    expect(result.checks).toHaveLength(6);
  });
});
