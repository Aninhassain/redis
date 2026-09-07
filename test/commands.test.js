import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import test from "node:test";

import { execute } from "../src/commands/index.js";
import { Store } from "../src/storage/Store.js";

const run = (store, line, context = {}) =>
  execute(store, line.split(" "), context);

test("SET and GET", () => {
  const store = new Store();

  assert.deepEqual(run(store, "SET name Alice"), { type: "simple", value: "OK" });
  assert.deepEqual(run(store, "get name"), { type: "bulk", value: "Alice" });
  assert.deepEqual(run(store, "GET age"), { type: "nil" });
});

test("SET on an existing key overwrites it", () => {
  const store = new Store();

  run(store, "SET name Alice");
  run(store, "SET name Bob");

  assert.deepEqual(run(store, "GET name"), { type: "bulk", value: "Bob" });
  assert.deepEqual(run(store, "KEYS *").items, [{ type: "bulk", value: "name" }]);
});

test("DEL, EXISTS and KEYS handle colliding keys", () => {
  const store = new Store();

  run(store, "SET ab one");
  run(store, "SET ba two");

  assert.deepEqual(run(store, "EXISTS ab ba nope"), { type: "integer", value: 2 });
  assert.deepEqual(run(store, "DEL ab nope"), { type: "integer", value: 1 });
  assert.deepEqual(run(store, "EXISTS ab"), { type: "integer", value: 0 });
  assert.deepEqual(run(store, "KEYS").items, [{ type: "bulk", value: "ba" }]);
});

test("PING and COMMAND", () => {
  const store = new Store();

  assert.deepEqual(run(store, "PING"), { type: "simple", value: "PONG" });
  assert.deepEqual(run(store, "PING hello"), { type: "bulk", value: "hello" });
  assert.ok(run(store, "COMMAND").items.length > 0);
});

test("invalid arguments and unknown commands return redis style errors", () => {
  const store = new Store();

  assert.match(run(store, "GET").value, /wrong number of arguments for 'get'/);
  assert.match(run(store, "SET only-key").value, /wrong number of arguments for 'set'/);
  assert.match(run(store, "EXPIRE k soon").value, /not an integer/);
  assert.match(run(store, "SET k v ZZ 10").value, /syntax error/);
  assert.match(run(store, "FLY away").value, /unknown command 'FLY'/);
});

test("SET ... EX / PX expire the key", async () => {
  const store = new Store();

  run(store, "SET short lived PX 20");

  assert.deepEqual(run(store, "GET short"), { type: "bulk", value: "lived" });
  assert.deepEqual(run(store, "TTL short"), { type: "integer", value: 1 });

  await sleep(40);

  assert.deepEqual(run(store, "GET short"), { type: "nil" });
  assert.deepEqual(run(store, "EXISTS short"), { type: "integer", value: 0 });
  assert.deepEqual(run(store, "TTL short"), { type: "integer", value: -2 });
  assert.deepEqual(run(store, "KEYS").items, []);
});

test("TTL and EXPIRE", () => {
  const store = new Store();

  run(store, "SET k v");

  assert.deepEqual(run(store, "TTL k"), { type: "integer", value: -1 });
  assert.deepEqual(run(store, "EXPIRE k 100"), { type: "integer", value: 1 });
  assert.deepEqual(run(store, "TTL k"), { type: "integer", value: 100 });
  assert.deepEqual(run(store, "EXPIRE missing 100"), { type: "integer", value: 0 });
});

test("SAVE calls the persistence hook", () => {
  const store = new Store();
  let saved = 0;

  assert.deepEqual(run(store, "SAVE", { save: () => saved++ }), {
    type: "simple",
    value: "OK"
  });
  assert.equal(saved, 1);
  assert.match(run(store, "SAVE").value, /persistence is not enabled/);
});
