/**
 * Splits an inline command line ("SET name Alice") into arguments.
 * Quoted values are kept together: SET greeting "hello world".
 */
export function parseInline(line) {
  const args = [];
  let current = "";
  let quote = null;

  for (const char of line) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === " " || char === "\t") {
      if (current !== "") {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current !== "") {
    args.push(current);
  }

  return args;
}

/**
 * Incremental parser for a TCP connection. Understands both RESP arrays
 * (what redis-cli sends) and plain inline commands (what telnet/nc send).
 * Feed it chunks, it returns the complete commands it could read.
 */
export class CommandParser {
  constructor() {
    this.buffer = "";
  }

  push(chunk) {
    this.buffer += chunk;

    const commands = [];
    let command;

    while ((command = this._next()) !== null) {
      if (command.length > 0) {
        commands.push(command);
      }
    }

    return commands;
  }

  _next() {
    if (this.buffer.length === 0) {
      return null;
    }

    if (this.buffer[0] !== "*") {
      const end = this.buffer.indexOf("\n");

      if (end === -1) {
        return null;
      }

      const line = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 1);

      return parseInline(line.trim());
    }

    return this._nextRESP();
  }

  _nextRESP() {
    let cursor = this.buffer.indexOf("\r\n");

    if (cursor === -1) {
      return null;
    }

    const count = Number.parseInt(this.buffer.slice(1, cursor), 10);
    const args = [];
    let offset = cursor + 2;

    for (let i = 0; i < count; i++) {
      const headerEnd = this.buffer.indexOf("\r\n", offset);

      if (headerEnd === -1) {
        return null;
      }

      const length = Number.parseInt(this.buffer.slice(offset + 1, headerEnd), 10);
      const start = headerEnd + 2;

      if (this.buffer.length < start + length + 2) {
        return null;
      }

      args.push(this.buffer.slice(start, start + length));
      offset = start + length + 2;
    }

    this.buffer = this.buffer.slice(offset);
    return args;
  }
}
