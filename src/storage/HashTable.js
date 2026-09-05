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

    console.log("Key:", key);
    console.log("Hash index:", index);

    if (!this.buckets[index]) {
      this.buckets[index] = [];
    }

    this.buckets[index].push([key, value]);
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