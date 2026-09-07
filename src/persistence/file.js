import fs from "node:fs";

/** Writes the live keys, their values and their expiry timestamps as JSON. */
export function saveToFile(store, path) {
  const payload = { savedAt: Date.now(), records: store.snapshot() };

  fs.writeFileSync(path, JSON.stringify(payload, null, 2));
}

export function loadFromFile(store, path) {
  if (!fs.existsSync(path)) {
    return 0;
  }

  try {
    const payload = JSON.parse(fs.readFileSync(path, "utf8"));

    store.load(payload.records ?? []);
    return store.keys().length;
  } catch (error) {
    console.error(`Could not read dump file ${path}: ${error.message}`);
    return 0;
  }
}
