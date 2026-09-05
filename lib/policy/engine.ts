export interface PolicyInput {
  amount: number;
  quantity: number;
  category: string;
  stock: number;
  isActive: boolean;
  userConfirmed: boolean;
  isDuplicateAttempt: boolean;
  config: {
    confirmationRequired: boolean;
    maximumAmount: number;
    maximumQuantity: number;
    allowedCategories: string[] | null;
  };
}

export interface PolicyResult {
  allowed: boolean;
  reasons: string[];
  checks: string[];
}

export function evaluatePurchase(input: PolicyInput): PolicyResult {
  const { amount, quantity, category, stock, isActive, userConfirmed, isDuplicateAttempt, config } = input;
  const reasons: string[] = [];
  const checks: string[] = [];

  if (isDuplicateAttempt) {
    checks.push('✗ Duplicate request (idempotency key already used)');
    reasons.push('This request was already processed — returning the existing order instead of creating a duplicate.');
    return { allowed: false, reasons, checks };
  }
  checks.push('✓ Not a duplicate request');

  if (config.confirmationRequired && !userConfirmed) {
    checks.push('✗ User confirmation present');
    reasons.push('Explicit user confirmation is required before payment.');
  } else {
    checks.push('✓ User confirmation present');
  }

  if (!isActive || stock <= 0) {
    checks.push('✗ Product in stock');
    reasons.push('Product is out of stock or no longer active.');
  } else {
    checks.push('✓ Product in stock');
  }

  if (quantity > config.maximumQuantity) {
    checks.push('✗ Quantity within limit');
    reasons.push(`Quantity ${quantity} exceeds the maximum allowed quantity of ${config.maximumQuantity}.`);
  } else {
    checks.push('✓ Quantity within limit');
  }

  const total = amount * quantity;
  if (total > config.maximumAmount) {
    checks.push('✗ Under spending limit');
    reasons.push(`Transaction total ₹${(total / 100).toFixed(2)} exceeds the ₹${(config.maximumAmount / 100).toFixed(2)} spending limit.`);
  } else {
    checks.push('✓ Under spending limit');
  }

  if (config.allowedCategories && !config.allowedCategories.includes(category)) {
    checks.push('✗ Product category allowed');
    reasons.push(`Category '${category}' is not in the allowed category list.`);
  } else {
    checks.push('✓ Product category allowed');
  }

  return { allowed: reasons.length === 0, reasons, checks };
}
