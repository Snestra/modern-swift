import assert from "node:assert/strict";
import { test } from "node:test";

import { Cart, CartError, InvalidQuantityError, UnknownSkuError, money, parseCoupon } from "./cart.ts";

test("parseCoupon accepts the three kinds", () => {
  assert.deepEqual(parseCoupon("SAVE15"), { kind: "percent", percent: 15 });
  assert.deepEqual(parseCoupon("OFF500"), { kind: "fixed", cents: 500 });
  assert.deepEqual(parseCoupon("FREE:mug"), { kind: "freeItem", sku: "mug" });
});

test("parseCoupon trims and ignores case but keeps the sku's case", () => {
  assert.deepEqual(parseCoupon("  save5 "), { kind: "percent", percent: 5 });
  assert.deepEqual(parseCoupon("free:Mug-XL"), { kind: "freeItem", sku: "Mug-XL" });
});

for (const code of [null, undefined, "", "SAVE", "SAVE0", "SAVE101", "SAVE1.5", "SAVE-5", "OFF0", "OFF", "FREE:", "FREE:a:b", "HELLO"]) {
  test(`parseCoupon rejects ${JSON.stringify(code)}`, () => {
    assert.equal(parseCoupon(code), null);
  });
}

test("items keep insertion order and adding a sku again sums the quantity", () => {
  const cart = new Cart();
  cart.add("tea", "Green tea", 450);
  cart.add("mug", "Mug", 1200, 2);
  cart.add("tea", "Renamed tea", 999, 3);
  assert.deepEqual(cart.items(), [
    { sku: "tea", name: "Green tea", unitCents: 450, quantity: 4 },
    { sku: "mug", name: "Mug", unitCents: 1200, quantity: 2 },
  ]);
});

test("items returns copies", () => {
  const cart = new Cart();
  cart.add("tea", "Green tea", 450);
  cart.items()[0].quantity = 99;
  assert.equal(cart.items()[0].quantity, 1);
});

test("add rejects a quantity that is not a positive whole number", () => {
  const cart = new Cart();
  for (const quantity of [0, -1, 1.5]) {
    assert.throws(
      () => cart.add("tea", "Green tea", 450, quantity),
      (error: unknown) =>
        error instanceof InvalidQuantityError && error instanceof CartError && error.sku === "tea" && error.quantity === quantity,
    );
  }
  assert.deepEqual(cart.items(), []);
});

test("setQuantity changes, removes, and validates", () => {
  const cart = new Cart();
  cart.add("tea", "Green tea", 450);
  cart.add("mug", "Mug", 1200);
  cart.setQuantity("tea", 5);
  cart.setQuantity("mug", 0);
  assert.deepEqual(cart.items(), [{ sku: "tea", name: "Green tea", unitCents: 450, quantity: 5 }]);
  assert.throws(() => cart.setQuantity("mug", 1), (error: unknown) => error instanceof UnknownSkuError && error.sku === "mug");
  assert.throws(() => cart.setQuantity("tea", -1), InvalidQuantityError);
  assert.equal(new UnknownSkuError("mug").message, 'unknown sku "mug"');
});

test("percent coupon rounds half a cent up", () => {
  const cart = new Cart();
  cart.add("pin", "Pin", 150);
  assert.equal(cart.applyCoupon("SAVE15"), true);
  // 15 percent of 150 is 22.5 cents.
  assert.deepEqual(cart.totals(), { subtotalCents: 150, discountCents: 23, totalCents: 127 });
});

test("fixed coupon never makes the total negative", () => {
  const cart = new Cart();
  cart.add("pin", "Pin", 150);
  cart.applyCoupon("OFF500");
  assert.deepEqual(cart.totals(), { subtotalCents: 150, discountCents: 150, totalCents: 0 });
});

test("free item coupon takes off one unit, or nothing when the sku is absent", () => {
  const cart = new Cart();
  cart.add("mug", "Mug", 1200, 2);
  cart.applyCoupon("FREE:mug");
  assert.equal(cart.totals().discountCents, 1200);
  cart.applyCoupon("FREE:MUG");
  assert.equal(cart.totals().discountCents, 0);
});

test("a rejected coupon keeps the current coupon", () => {
  const cart = new Cart();
  cart.add("mug", "Mug", 1200);
  cart.applyCoupon("OFF200");
  assert.equal(cart.applyCoupon("nonsense"), false);
  assert.equal(cart.applyCoupon(null), false);
  assert.equal(cart.totals().discountCents, 200);
});

test("receipt lists items in insertion order and hides a zero discount", () => {
  const cart = new Cart();
  cart.add("tea", "Green tea", 450, 2);
  cart.add("mug", "Mug", 1205);
  assert.equal(cart.receipt(), "2 x Green tea @ $4.50 = $9.00\n1 x Mug @ $12.05 = $12.05\nsubtotal $21.05\ntotal $21.05");
  cart.applyCoupon("save10");
  assert.equal(
    cart.receipt(),
    "2 x Green tea @ $4.50 = $9.00\n1 x Mug @ $12.05 = $12.05\nsubtotal $21.05\ndiscount -$2.11\ntotal $18.94",
  );
});

test("empty cart", () => {
  const cart = new Cart();
  assert.deepEqual(cart.totals(), { subtotalCents: 0, discountCents: 0, totalCents: 0 });
  assert.equal(cart.receipt(), "subtotal $0.00\ntotal $0.00");
});

test("money pads cents", () => {
  assert.equal(money(5), "$0.05");
  assert.equal(money(100), "$1.00");
  assert.equal(money(123456), "$1234.56");
});
