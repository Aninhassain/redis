import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";

import { createServer } from "../src/server.js";
import { Store } from "../src/storage/Store.js";

/** Opens a client and returns a send() that resolves with the raw RESP reply. */
async function connect(port) {
  const socket = net.createConnection({ port });
  socket.setEncoding("utf8");

  await new Promise((resolve) => socket.once("connect", resolve));

  return {
    send(line) {
      return new Promise((resolve) => {
        socket.once("data", resolve);
        socket.write(`${line}\r\n`);
      });
    },
    close: () => socket.end()
  };
}

test("serves multiple clients from the same store", async (t) => {
  const store = new Store();
  const server = createServer({ store, save: () => {} });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  t.after(() => server.close());

  const alice = await connect(port);
  const bob = await connect(port);

  assert.equal(await alice.send("PING"), "+PONG\r\n");
  assert.equal(await alice.send("SET shared hello"), "+OK\r\n");
  assert.equal(await bob.send("GET shared"), "$5\r\nhello\r\n");
  assert.equal(await bob.send("GET missing"), "$-1\r\n");
  assert.equal(await bob.send("DEL shared"), ":1\r\n");
  assert.equal(await alice.send("EXISTS shared"), ":0\r\n");

  alice.close();
  assert.equal(await bob.send("PING"), "+PONG\r\n");
  bob.close();
});

test("understands the RESP arrays sent by real redis clients", async (t) => {
  const store = new Store();
  const server = createServer({ store, save: () => {} });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  t.after(() => server.close());

  const client = await connect(port);

  assert.equal(
    await client.send("*3\r\n$3\r\nSET\r\n$4\r\nname\r\n$5\r\nAlice"),
    "+OK\r\n"
  );
  assert.equal(store.get("name"), "Alice");

  client.close();
});
