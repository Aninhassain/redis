import readline from "node:readline";

import { CLOSING_COMMANDS, execute } from "./commands/index.js";
import { parseInline } from "./protocol/parser.js";
import { formatText } from "./protocol/reply.js";

/** Optional local REPL that talks to the store directly, without TCP. */
export function startCLI({ store, save, onQuit }) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "redis> "
  });

  rl.prompt();

  rl.on("line", (line) => {
    const args = parseInline(line.trim());
    const result = execute(store, args, { save });

    if (result !== null) {
      console.log(formatText(result));

      if (CLOSING_COMMANDS.has(args[0].toUpperCase())) {
        rl.close();
        return;
      }
    }

    rl.prompt();
  });

  rl.on("close", () => onQuit?.());

  return rl;
}
