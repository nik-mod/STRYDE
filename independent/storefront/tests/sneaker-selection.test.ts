import test from "node:test";
import assert from "node:assert/strict";
import {
  isSneaker,
  hasSharpSneakerPhoto,
} from "../src/lib/sneaker-selection.mjs";

test("sneaker catalog excludes other footwear and accessories", () => {
  for (const [brand, title] of [
    ["adidas", "Adidas Adilette Slide Black"],
    ["Balenciaga", "Balenciaga Track Mule Black"],
    ["Gucci", "Gucci Princetown Loafer"],
    ["Nike", "Nike Air Max 270 Golf Dark Beetroot"],
    ["Nike", "Nike Air Force 1 Socks White"],
    ["Nike", "Nike Air Force 1 Duckboot Dark Loden"],
    ["Nike", "Nike Air Max 95 Sneakerboot Black Anthracite"],
    ["Nike", "Nike Air Max Goadome Armory Navy"],
    ["Jordan", "Air Jordan 1 Crib Bootie Chicago"],
    ["adidas", "adidas Yeezy 950 Chocolate"],
    ["New Balance", "New Balance 4040v5 Metal Black"],
    ["New Balance", "New Balance 3000v6 Metal Black"],
    ["Reebok", "Reebok Beatnik Black"],
    ["Timberland", "Timberland Premium 6 Inch Boot"],
    ["Unknown", "Unidentified archive item"],
  ])
    assert.equal(isSneaker({ brand, title }), false, title);
});
test("lifestyle, skate, running and basketball sneakers remain eligible", () => {
  for (const [brand, title] of [
    ["Nike", "Nike Air Force 1 Low White"],
    ["Nike", "Nike Air Max 270 Light Soft Pink"],
    ["Jordan", "Jordan 1 Retro High"],
    ["New Balance", "New Balance 9060 Sea Salt White"],
    ["adidas", "adidas Campus 00s Grey"],
    ["Reebok", "Reebok Instapump Fury Black"],
    ["Golden Goose", "Golden Goose Super Star White Black"],
    ["Maison Margiela", "Maison Margiela Replica Light Blue"],
    ["Converse", "Converse Chuck 70 Black"],
    ["Vans", "Vans Classic Slip On Black White"],
  ])
    assert.equal(isSneaker({ brand, title }), true, title);
});
test("small or unchecked images cannot return through the sneaker filter", () => {
  const item = {
    brand: "Nike",
    title: "Nike Air Max 1",
    imageQuality: { status: "ready", width: 800, height: 571 },
  };
  assert.equal(hasSharpSneakerPhoto(item), true);
  assert.equal(
    hasSharpSneakerPhoto({
      ...item,
      imageQuality: { status: "ready", width: 200, height: 143 },
    }),
    false,
  );
  assert.equal(
    hasSharpSneakerPhoto({ ...item, imageQuality: undefined }),
    false,
  );
  assert.equal(
    hasSharpSneakerPhoto({ ...item, title: "Nike Air Max Golf" }),
    false,
  );
});
