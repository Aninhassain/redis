import assert from "node:assert/strict";
import test from "node:test";

import { HashTable } from "../src/storage/HashTable.js";

test("stores and reads values", () => {
  const table = new HashTable();

  table.set("name", "Alice");

  assert.equal(table.get("name"), "Alice");
  assert.equal(table.get("missing"), undefined);
});

test("setting an existing key updates it instead of duplicating", () => {
  const table = new HashTable();

  table.set("name", "Alice");
  table.set("name", "Bob");

  assert.equal(table.get("name"), "Bob");
  assert.equal(table.length, 1);
  assert.deepEqual(table.keys(), ["name"]);
});

test("keys that collide share a bucket but stay independent", () => {
  const table = new HashTable();

  assert.equal(table._hash("ab"), table._hash("ba"));

  table.set("ab", "first");
  table.set("ba", "second");

  assert.equal(table.get("ab"), "first");
  assert.equal(table.get("ba"), "second");

  assert.equal(table.delete("ab"), true);
  assert.equal(table.get("ab"), undefined);
  assert.equal(table.get("ba"), "second");
  assert.equal(table.has("ba"), true);
});

test("delete reports whether the key was there", () => {
  const table = new HashTable();

  table.set("a", 1);

  assert.equal(table.delete("a"), true);
  assert.equal(table.delete("a"), false);
  assert.equal(table.length, 0);
});

test("keys lists every stored key", () => {
  const table = new HashTable();

  table.set("ab", 1);
  table.set("ba", 2);
  table.set("z", 3);

  assert.deepEqual(table.keys().sort(), ["ab", "ba", "z"]);
});
