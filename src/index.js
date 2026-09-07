// import readline from "node:readline";
// import { HashTable } from "./storage/HashTable.js";

// const db = new HashTable();

// db.set("name", "Alice");

// console.log(db.get("name"));
// console.log(db.get("age"));
import { HashTable } from "./storage/HashTable.js";

const db = new HashTable();

db.set("ab", "first");
db.set("ba", "second");

console.log(db.buckets);
console.log(db.get("ab"));
console.log(db.get("ba"));

// import { HashTable } from "./storage/HashTable.js";

// const db = new HashTable();

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   prompt: "redis> "
// });

// console.log(db._hash("name"));
// console.log(db._hash("age"));
// console.log(db._hash("language"));

// console.log("My Redis server is starting...");
// rl.prompt();

// rl.on("line", (input) => {
//   const parts = input.trim().split(/\s+/);

//   const command = parts[0]?.toUpperCase();

//   switch (command) {
//     case "SET": {
//       const key = parts[1];
//       const value = parts.slice(2).join(" ");

//       if (!key || !value) {
//         console.log("ERR wrong number of arguments");
//         break;
//       }

//       db.set(key, value);

//       console.log("OK");
//       break;
//     }

//     case "GET": {
//       const key = parts[1];

//       if (!key) {
//         console.log("ERR wrong number of arguments");
//         break;
//       }

//       const value = db.get(key);

//       console.log(value ?? "(nil)");
//       break;
//     }

//     case "DEL": {
//       const key = parts[1];

//       if (!key) {
//         console.log("ERR wrong number of arguments");
//         break;
//       }

//       const deleted = db.delete(key);

//       console.log(deleted ? 1 : 0);
//       break;
//     }

//     case "EXIT": {
//       rl.close();
//       return;
//     }

//     default: {
//       console.log(`ERR unknown command '${command}'`);
//     }
//   }

//   rl.prompt();
// });