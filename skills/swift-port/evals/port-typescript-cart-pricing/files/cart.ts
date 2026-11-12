// Prices a shopping cart. All money is in whole cents.

export type Coupon =
  | { kind: "percent"; percent: number }
  | { kind: "fixed"; cents: number }
  | { kind: "freeItem"; sku: string };

export interface Line {
  sku: string;
  name: string;
  unitCents: number;
  quantity: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export class CartError extends Error {}

export class UnknownSkuError extends CartError {
  readonly sku: string;

  constructor(sku: string) {
    super(`unknown sku "${sku}"`);
    this.sku = sku;
  }
}

export class InvalidQuantityError extends CartError {
  readonly sku: string;
  readonly quantity: number;

  constructor(sku: string, quantity: number) {
    super(`invalid quantity ${quantity} for "${sku}"`);
    this.sku = sku;
    this.quantity = quantity;
  }
}

/**
 * Parses a coupon code. Codes are trimmed and case-insensitive.
 *   "SAVE15"     -> 15 percent off, 1 to 100 only
 *   "OFF500"     -> 500 cents off
 *   "FREE:mug"   -> one unit of sku "mug" is free (the sku keeps its case)
 * Returns null for anything else.
 */
export function parseCoupon(code: string | null | undefined): Coupon | null {
  if (code == null) return null;
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();
  if (upper.startsWith("SAVE")) {
    const percent = wholeNumber(upper.slice(4));
    if (percent === null || percent < 1 || percent > 100) return null;
    return { kind: "percent", percent };
  }
  if (upper.startsWith("OFF")) {
    const cents = wholeNumber(upper.slice(3));
    if (cents === null || cents === 0) return null;
    return { kind: "fixed", cents };
  }
  if (upper.startsWith("FREE:")) {
    const parts = trimmed.split(":");
    if (parts.length !== 2 || parts[1] === "") return null;
    return { kind: "freeItem", sku: parts[1] };
  }
  return null;
}

function wholeNumber(text: string): number | null {
  return /^[0-9]+$/.test(text) ? Number(text) : null;
}

export class Cart {
  private readonly lines = new Map<string, Line>();
  private coupon: Coupon | null = null;

  /** Adds units of an item. Adding a sku again increases its quantity and keeps its first name and price. */
  add(sku: string, name: string, unitCents: number, quantity = 1): void {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new InvalidQuantityError(sku, quantity);
    }
    const existing = this.lines.get(sku);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.lines.set(sku, { sku, name, unitCents, quantity });
    }
  }

  /** Sets the quantity of a line. Zero removes the line. */
  setQuantity(sku: string, quantity: number): void {
    const line = this.lines.get(sku);
    if (!line) throw new UnknownSkuError(sku);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidQuantityError(sku, quantity);
    }
    if (quantity === 0) {
      this.lines.delete(sku);
    } else {
      line.quantity = quantity;
    }
  }

  /** Applies a coupon code and reports whether it was accepted. A rejected code keeps the current coupon. */
  applyCoupon(code: string | null): boolean {
    const parsed = parseCoupon(code);
    if (parsed === null) return false;
    this.coupon = parsed;
    return true;
  }

  /** Lines in the order their sku was first added. */
  items(): Line[] {
    return [...this.lines.values()].map((line) => ({ ...line }));
  }

  totals(): Totals {
    let subtotalCents = 0;
    for (const line of this.lines.values()) {
      subtotalCents += line.unitCents * line.quantity;
    }
    const discountCents = Math.min(subtotalCents, this.discount(subtotalCents));
    return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
  }

  private discount(subtotalCents: number): number {
    const coupon = this.coupon;
    if (coupon === null) return 0;
    switch (coupon.kind) {
      case "percent":
        return Math.round((subtotalCents * coupon.percent) / 100);
      case "fixed":
        return coupon.cents;
      case "freeItem":
        return this.lines.get(coupon.sku)?.unitCents ?? 0;
    }
  }

  /** One line per item in insertion order, then the totals. */
  receipt(): string {
    const rows = this.items().map(
      (line) => `${line.quantity} x ${line.name} @ ${money(line.unitCents)} = ${money(line.unitCents * line.quantity)}`,
    );
    const totals = this.totals();
    rows.push(`subtotal ${money(totals.subtotalCents)}`);
    if (totals.discountCents > 0) rows.push(`discount -${money(totals.discountCents)}`);
    rows.push(`total ${money(totals.totalCents)}`);
    return rows.join("\n");
  }
}

export function money(cents: number): string {
  const whole = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `$${whole}.${rest}`;
}
