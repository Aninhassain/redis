import { reply } from "../protocol/reply.js";

const wrongArgs = (name) =>
  reply.error(`ERR wrong number of arguments for '${name}' command`);

const notInteger = () => reply.error("ERR value is not an integer or out of range");

const commands = {
  PING(store, args) {
    if (args.length > 1) {
      return wrongArgs("ping");
    }

    return args.length === 1 ? reply.bulk(args[0]) : reply.simple("PONG");
  },

  SET(store, args) {
    if (args.length !== 2 && args.length !== 4) {
      return wrongArgs("set");
    }

    const [key, value, option, amount] = args;
    let expiresAt = null;

    if (option !== undefined) {
      const unit = option.toUpperCase();

      if (unit !== "EX" && unit !== "PX") {
        return reply.error("ERR syntax error");
      }

      const parsed = Number(amount);

      if (!Number.isInteger(parsed)) {
        return notInteger();
      }

      if (parsed <= 0) {
        return reply.error("ERR invalid expire time in 'set' command");
      }

      expiresAt = Date.now() + (unit === "EX" ? parsed * 1000 : parsed);
    }

    store.set(key, value, expiresAt);
    return reply.simple("OK");
  },

  GET(store, args) {
    if (args.length !== 1) {
      return wrongArgs("get");
    }

    const value = store.get(args[0]);
    return value === undefined ? reply.nil() : reply.bulk(value);
  },

  DEL(store, args) {
    if (args.length === 0) {
      return wrongArgs("del");
    }

    const deleted = args.filter((key) => store.delete(key)).length;
    return reply.integer(deleted);
  },

  EXISTS(store, args) {
    if (args.length === 0) {
      return wrongArgs("exists");
    }

    const found = args.filter((key) => store.exists(key)).length;
    return reply.integer(found);
  },

  KEYS(store, args) {
    if (args.length > 1) {
      return wrongArgs("keys");
    }

    return reply.array(store.keys().map((key) => reply.bulk(key)));
  },

  TTL(store, args) {
    if (args.length !== 1) {
      return wrongArgs("ttl");
    }

    return reply.integer(store.ttl(args[0]));
  },

  EXPIRE(store, args) {
    if (args.length !== 2) {
      return wrongArgs("expire");
    }

    const seconds = Number(args[1]);

    if (!Number.isInteger(seconds)) {
      return notInteger();
    }

    return reply.integer(store.expire(args[0], seconds) ? 1 : 0);
  },

  SAVE(store, args, context) {
    if (args.length !== 0) {
      return wrongArgs("save");
    }

    if (!context.save) {
      return reply.error("ERR persistence is not enabled");
    }

    context.save();
    return reply.simple("OK");
  },

  COMMAND() {
    return reply.array(Object.keys(commands).map((name) => reply.bulk(name)));
  },

  QUIT() {
    return reply.simple("OK");
  }
};

commands.EXIT = commands.QUIT;

export const CLOSING_COMMANDS = new Set(["QUIT", "EXIT"]);

/**
 * Runs one already parsed command.
 * `context` carries connection level helpers such as save().
 */
export function execute(store, args, context = {}) {
  if (args.length === 0) {
    return null;
  }

  const [rawName, ...rest] = args;
  const name = rawName.toUpperCase();
  const handler = commands[name];

  if (!handler) {
    const printable = rest.map((arg) => `'${arg}'`).join(", ");
    return reply.error(
      `ERR unknown command '${rawName}', with args beginning with: ${printable}`
    );
  }

  return handler(store, rest, context);
}
