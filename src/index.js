import { startCLI } from "./cli.js";
import { loadFromFile, saveToFile } from "./persistence/file.js";
import { createServer } from "./server.js";
import { Store } from "./storage/Store.js";

const port = Number(process.env.PORT ?? 6379);
const dumpFile = process.env.DUMP_FILE ?? "dump.json";
const withCLI = process.argv.includes("--cli");

const store = new Store();
const save = () => saveToFile(store, dumpFile);

const loaded = loadFromFile(store, dumpFile);
console.log(`Loaded ${loaded} key(s) from ${dumpFile}`);

const server = createServer({ store, save });

server.listen(port, () => {
  console.log(`Redis clone listening on port ${port}`);
});

let shuttingDown = false;

const shutdown = () => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  save();
  console.log(`\nSaved ${store.keys().length} key(s) to ${dumpFile}`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (withCLI) {
  startCLI({ store, save, onQuit: shutdown });
}
