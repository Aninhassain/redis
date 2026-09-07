import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadFromFile, saveToFile } from "../src/persistence/file.js";
import { Store } from "../src/storage/Store.js";

const tempFile = () =>
  path.join(fs.mkdtempSync(path.join(os.tmpdir(), "redis-")), "dump.json");

test("state survives a restart", (t) => {
  const file = tempFile();
  t.after(() => fs.rmSync(path.dirname(file), { recursive: true, force: true }));

  const first = new Store();
  first.set("name", "Alice");
  first.set("temp", "later", Date.now() + 60_000);
  saveToFile(first, file);

  const second = new Store();
  assert.equal(loadFromFile(second, file), 2);
  assert.equal(second.get("name"), "Alice");
  assert.equal(second.get("temp"), "later");
  assert.ok(second.ttl("temp") > 0);
});

test("expired keys are not restored", (t) => {
  const file = tempFile();
  t.after(() => fs.rmSync(path.dirname(file), { recursive: true, force: true }));

  fs.writeFileSync(
    file,
    JSON.stringify({
      records: [{ key: "gone", value: "x", expiresAt: Date.now() - 1000 }]
    })
  );

  const store = new Store();
  assert.equal(loadFromFile(store, file), 0);
  assert.equal(store.exists("gone"), false);
});

test("a missing dump file starts an empty database", () => {
  const store = new Store();

  assert.equal(loadFromFile(store, "/tmp/does-not-exist-redis-clone.json"), 0);
});
