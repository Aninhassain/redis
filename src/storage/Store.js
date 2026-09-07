import { HashTable } from "./HashTable.js";

/**
 * Key/value store on top of the hand written HashTable.
 * Each stored record is { value, expiresAt } where expiresAt is a
 * unix timestamp in milliseconds, or null when the key never expires.
 * Expiration is lazy: a key is removed the first time it is touched
 * after its deadline has passed.
 */
export class Store {
  constructor(table = new HashTable()) {
    this.table = table;
  }

  _live(key) {
    const record = this.table.get(key);

    if (!record) {
      return undefined;
    }

    if (record.expiresAt !== null && record.expiresAt <= Date.now()) {
      this.table.delete(key);
      return undefined;
    }

    return record;
  }

  set(key, value, expiresAt = null) {
    this.table.set(key, { value, expiresAt });
  }

  get(key) {
    return this._live(key)?.value;
  }

  exists(key) {
    return this._live(key) !== undefined;
  }

  delete(key) {
    if (!this._live(key)) {
      return false;
    }

    return this.table.delete(key);
  }

  keys() {
    return this.table.keys().filter((key) => this._live(key) !== undefined);
  }

  /** Remaining life in seconds: -2 when missing, -1 when it never expires. */
  ttl(key) {
    const record = this._live(key);

    if (!record) {
      return -2;
    }

    if (record.expiresAt === null) {
      return -1;
    }

    return Math.ceil((record.expiresAt - Date.now()) / 1000);
  }

  expire(key, seconds) {
    const record = this._live(key);

    if (!record) {
      return false;
    }

    record.expiresAt = Date.now() + seconds * 1000;
    return true;
  }

  /** Non expired records, used by persistence. */
  snapshot() {
    return this.keys().map((key) => {
      const record = this.table.get(key);
      return { key, value: record.value, expiresAt: record.expiresAt };
    });
  }

  load(records) {
    this.table.clear();

    for (const { key, value, expiresAt = null } of records) {
      if (expiresAt !== null && expiresAt <= Date.now()) {
        continue;
      }

      this.set(key, value, expiresAt);
    }
  }
}
