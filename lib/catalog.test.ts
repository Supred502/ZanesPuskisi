import { test } from "node:test";
import assert from "node:assert/strict";
import { currentPrice, suggestCategory, toProduct, coerceCategory } from "./catalog.ts";

test("suggestCategory reads Latvian names with or without diacritics", () => {
  assert.equal(suggestCategory("Ūdensrožu pušķis"), "Ūdensrozes");
  assert.equal(suggestCategory("udensrozes"), "Ūdensrozes");
  assert.equal(suggestCategory("Rožu dāvanu kaste"), "Rozes dāvanu kastes");
  assert.equal(suggestCategory("Rožu pušķītis"), "Rožu pušķīši");
  assert.equal(suggestCategory("Adventes vainags"), "Adventes kompozīcijas");
  assert.equal(suggestCategory("Kaut kas cits"), "Citu ziedu dekori");
});

test("currentPrice uses holiday price only when it is a real discount", () => {
  assert.equal(currentPrice({ price: 30, holidaySpecial: true, holidayPrice: 25 }), 25);
  assert.equal(currentPrice({ price: 30, holidaySpecial: true, holidayPrice: 35 }), 30);
  assert.equal(currentPrice({ price: 30, holidaySpecial: false, holidayPrice: 25 }), 30);
  assert.equal(currentPrice({ price: 30, holidaySpecial: true, holidayPrice: null }), 30);
});

test("toProduct cleans old and messy documents", () => {
  const p = toProduct("x", { name: "  A ", price: "12", imageURL: "https://a/b.jpg", category: "nope", tiktokLink: "javascript:alert(1)" });
  assert.equal(p.name, "A");
  assert.equal(p.price, 12);
  assert.deepEqual(p.images, ["https://a/b.jpg"]);
  assert.equal(p.category, "Citu ziedu dekori");
  assert.equal(p.available, true);
  assert.equal(p.tiktokLink, null);
  assert.equal(coerceCategory("Lieldienas"), "Lieldienas");
});
