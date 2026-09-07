export class HashTable {
  constructor(size = 16) {
    this.buckets = new Array(size);
    this.size = size;
    this.length = 0;
  }

  _hash(key) {
    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }

    return hash % this.size;
  }

  set(key, value) {
    const index = this._hash(key);

    if (!this.buckets[index]) {
      this.buckets[index] = [];
    }

    const bucket = this.buckets[index];

    for (const entry of bucket) {
      if (entry[0] === key) {
        entry[1] = value;
        return;
      }
    }

    bucket.push([key, value]);
    this.length++;
  }

  get(key) {
    const bucket = this.buckets[this._hash(key)];

    if (!bucket) {
      return undefined;
    }

    for (const [storedKey, storedValue] of bucket) {
      if (storedKey === key) {
        return storedValue;
      }
    }

    return undefined;
  }

  has(key) {
    const bucket = this.buckets[this._hash(key)];

    if (!bucket) {
      return false;
    }

    return bucket.some(([storedKey]) => storedKey === key);
  }

  delete(key) {
    const bucket = this.buckets[this._hash(key)];

    if (!bucket) {
      return false;
    }

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.length--;
        return true;
      }
    }

    return false;
  }

  keys() {
    const result = [];

    for (const bucket of this.buckets) {
      if (!bucket) {
        continue;
      }

      for (const [key] of bucket) {
        result.push(key);
      }
    }

    return result;
  }

  entries() {
    const result = [];

    for (const bucket of this.buckets) {
      if (!bucket) {
        continue;
      }

      for (const [key, value] of bucket) {
        result.push([key, value]);
      }
    }

    return result;
  }

  clear() {
    this.buckets = new Array(this.size);
    this.length = 0;
  }
}
