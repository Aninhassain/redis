// import readline from "node:readline";
// import { HashTable } from "./storage/HashTable.js";

// const db = new HashTable();

// db.set("name", "Alice");

// console.log(db.get("name"));
// console.log(db.get("age"));
import { HashTable } from "./storage/HashTable.js";

const port = Number(process.env.PORT ?? 6379);
const dumpFile = process.env.DUMP_FILE ?? "dump.json";
const withCLI = process.argv.includes("--cli");

db.set("ab", "first");
db.set("ba", "second");

console.log(db.buckets);
console.log(db.get("ab"));
console.log(db.get("ba"));

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
