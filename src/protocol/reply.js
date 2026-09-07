export const reply = {
  simple: (value) => ({ type: "simple", value }),
  error: (value) => ({ type: "error", value }),
  integer: (value) => ({ type: "integer", value }),
  bulk: (value) => ({ type: "bulk", value }),
  nil: () => ({ type: "nil" }),
  array: (items) => ({ type: "array", items })
};

const CRLF = "\r\n";

/** Encode a reply in the RESP protocol so real redis clients understand it. */
export function encodeRESP(value) {
  switch (value.type) {
    case "simple":
      return `+${value.value}${CRLF}`;
    case "error":
      return `-${value.value}${CRLF}`;
    case "integer":
      return `:${value.value}${CRLF}`;
    case "bulk":
      return `$${Buffer.byteLength(value.value)}${CRLF}${value.value}${CRLF}`;
    case "nil":
      return `$-1${CRLF}`;
    case "array":
      return `*${value.items.length}${CRLF}${value.items.map(encodeRESP).join("")}`;
    default:
      throw new Error(`unknown reply type: ${value.type}`);
  }
}

/** Human readable encoding, used by the local readline CLI. */
export function formatText(value) {
  switch (value.type) {
    case "simple":
      return value.value;
    case "error":
      return `(error) ${value.value}`;
    case "integer":
      return `(integer) ${value.value}`;
    case "bulk":
      return `"${value.value}"`;
    case "nil":
      return "(nil)";
    case "array":
      if (value.items.length === 0) {
        return "(empty array)";
      }

      return value.items
        .map((item, i) => `${i + 1}) ${formatText(item)}`)
        .join("\n");
    default:
      throw new Error(`unknown reply type: ${value.type}`);
  }
}
