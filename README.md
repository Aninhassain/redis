# Redis clone

A small Redis-like in-memory database written from scratch in Node.js, with no
dependencies. Storage is a hand written hash table (no JavaScript `Map`), and
clients talk to it over TCP using the real Redis wire protocol.

## Project structure

```
redis/
├── src/
│   ├── index.js              entry point: load dump, start TCP server, optional CLI
│   ├── server.js             TCP server (node:net), one parser per connection
│   ├── cli.js                optional local readline REPL
│   ├── commands/
│   │   └── index.js          command table: parsing free, returns reply objects
│   ├── protocol/
│   │   ├── parser.js         inline + RESP request parsing
│   │   └── reply.js          reply constructors, RESP and text encoders
│   ├── storage/
│   │   ├── HashTable.js      buckets + separate chaining, written from scratch
│   │   └── Store.js          key/value + expiry on top of the hash table
│   └── persistence/
│       └── file.js           JSON snapshot save/load
├── test/                     node:test suites
└── package.json
```

## Running

```bash
npm start                  # TCP server on port 6379
PORT=7000 npm start        # different port
npm run cli                # TCP server + local redis> prompt
npm run dev                # restart on file changes
npm test                   # node --test test/
```

`DUMP_FILE` (default `dump.json`) sets the snapshot file.

## Manual testing

With `redis-cli`, if it is installed:

```bash
redis-cli -p 6379 set name Alice
redis-cli -p 6379 get name
redis-cli -p 6379 ttl name
```

Or with any raw TCP client, since inline commands are supported:

```bash
nc localhost 6379
SET name Alice
GET name
SET session token EX 30
TTL session
KEYS
EXISTS name
DEL name
SAVE
QUIT
```

## Architecture

Four layers, each one only knows about the layer below it:

1. **HashTable** — fixed array of buckets, index = sum of character codes modulo
   size, collisions handled by separate chaining. `set` overwrites an existing
   key instead of appending a duplicate.
2. **Store** — wraps the table, storing `{ value, expiresAt }` per key.
   Expiration is lazy: a key past its deadline is deleted the first time
   `GET`/`EXISTS`/`KEYS`/`TTL` touches it, so there is no background timer.
3. **Commands** — a table of pure functions `(store, args, context) -> reply`.
   They never touch sockets, which is why the TCP server and the local REPL can
   share them; the difference is only how the reply is encoded.
4. **Transports** — `server.js` encodes replies as RESP, `cli.js` prints them as
   human readable text. Persistence is a JSON snapshot written by `SAVE` and on
   graceful shutdown (SIGINT/SIGTERM), and read back at startup.

## Implemented

`SET key value [EX seconds | PX milliseconds]`, `GET`, `DEL key [key ...]`,
`EXISTS key [key ...]`, `KEYS`, `TTL`, `EXPIRE`, `PING [message]`, `COMMAND`,
`SAVE`, `QUIT`/`EXIT`, Redis-style error replies, multiple concurrent TCP
clients, RESP and inline request parsing, snapshot persistence with expiry
timestamps.

## Intentionally not supported

Replication, clustering, transactions (`MULTI`/`EXEC`), Lua scripting, pub/sub,
streams, RDB/AOF file formats, key eviction policies, `SELECT`/multiple
databases, authentication, glob patterns for `KEYS`, and every data type other
than strings (no lists, sets, sorted sets or hashes).
