/**
 * Represents an implementation of the XorShift algorithm for generating random numbers.
 *
 * This class provides methods for generating random integers and random integers within a specified range.
 */
export class XorShift {
  private x: number;
  private y: number;
  private z: number;
  private w: number;

  constructor(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  nextInt = (): number => {
    const t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    return this.w;
  }

  nextIntBet = (from: number, to: number): number => {
    if ((to - from) <= 0) {
      return 0;
    }

    return from + (Math.abs(this.nextInt()) % (to - from));
  }

  // Initialize deterministic random function by ethereum address.
  static getDeterministicRandomBy(address: string): XorShift {
    const ints: number[] = [];

    for (let i = 0; i < 4; i++) {
      const start = address.length - 8 * (i + 1);
      const end = start + 8;
      const chunk = address.slice(start, end);
      const intValue = parseInt(chunk, 16);
      ints.unshift(intValue);
    }

    return new XorShift(ints[0], ints[1], ints[2], ints[3]);
  }
}
