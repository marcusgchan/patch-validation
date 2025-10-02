export function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function calculateTax(amount: number, taxRate: number = 0.08): number {
  return amount * taxRate;
}

export function calculateDiscount(
  amount: number,
  discountPercent: number
): number {
  return amount * (discountPercent / 100);
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// Unused function for validator to catch
export function calculateShipping(weight: number, distance: number): number {
  const baseRate = 5.99;
  const weightRate = weight * 0.5;
  const distanceRate = distance * 0.1;
  return baseRate + weightRate + distanceRate;
}

// Another unused function
export function calculateInterest(
  principal: number,
  rate: number,
  time: number
): number {
  return principal * rate * time;
}

// Yet another unused function
export function isEven(number: number): boolean {
  return number % 2 === 0;
}

// More unused functions
export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
