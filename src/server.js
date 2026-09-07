import net from "node:net";

import { CLOSING_COMMANDS, execute } from "./commands/index.js";
import { CommandParser } from "./protocol/parser.js";
import { encodeRESP, reply } from "./protocol/reply.js";

/**
 * TCP front end. Every connection gets its own parser but shares the
 * single in memory store, exactly like a real redis server.
 */
export function createServer({ store, save }) {
  return net.createServer((socket) => {
    const parser = new CommandParser();

    socket.setEncoding("utf8");

    socket.on("data", (chunk) => {
      let commands;

      try {
        commands = parser.push(chunk);
      } catch (error) {
        socket.write(encodeRESP(reply.error(`ERR protocol error: ${error.message}`)));
        socket.end();
        return;
      }

      for (const args of commands) {
        const result = execute(store, args, { save });

        if (result === null) {
          continue;
        }

        socket.write(encodeRESP(result));

        if (CLOSING_COMMANDS.has(args[0].toUpperCase())) {
          socket.end();
          return;
        }
      }
    });

    socket.on("error", (error) => {
      console.error(`Client error: ${error.message}`);
      socket.destroy();
    });
  });
}
