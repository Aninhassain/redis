export class HashTable {
  constructor(size = 10) {
    this.buckets = new Array(size);
    this.size = size;
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
}

  get(key) {
    const index = this._hash(key);

    const bucket = this.buckets[index];

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
}