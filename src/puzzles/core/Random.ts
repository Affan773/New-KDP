/**
 * Deterministic Seeded Pseudo-Random Number Generator (PRNG).
 * Uses Mulberry32 algorithm for fast, high-quality 32-bit state random numbers.
 */
export class Random {
  private state: number;

  constructor(seed: number | string = Date.now()) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.state = hash;
    } else {
      this.state = seed;
    }
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive).
   */
  nextInt(min: number, max: number): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.next() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
   * Returns a random item from the provided array.
   */
  choice<T>(array: T[]): T {
    if (!array || array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = this.nextInt(0, array.length - 1);
    return array[idx];
  }

  /**
   * Randomly samples `count` unique items from an array.
   */
  sample<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle([...array]);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Returns true with a given probability (0 to 1).
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}
