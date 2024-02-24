import Redis from "ioredis";

export default interface Benchmark {
  initialize(): Promise<void>;
  memoryUsage(): Promise<number>;
  cleanUp(): Promise<number>;
}

export type Options = {
  maxKeyLength: number;
  initKeys: number;
};

export const DefaultOptions: Options = {
  maxKeyLength: 15,
  initKeys: 100000,
};

export abstract class BaseBenchmark implements Benchmark {
  options: Options;

  redis: Redis = new Redis();

  constructor(options?: Partial<Options>) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };
  }

  abstract initialize(): Promise<void>;

  abstract memoryUsage(): Promise<number>;

  abstract cleanUp(): Promise<number>;

  generateCJK(length: number): string;

  generateCJK(length: number, amount: number): string[];

  generateCJK(length: number, amount: number = 1): string | string[] {
    const startCJK = 0x4d00;
    const endCJK = 0x9fff;
    const cjkRange = endCJK - startCJK;

    const strings: string[] = [];

    const buffer: number[] = [];
    for (let i = 0; i < amount; i++) {
      for (let j = 0; j < length; j++) {
        buffer[j] = Math.floor(Math.random() * cjkRange) + startCJK;
      }

      strings.push(String.fromCharCode(...buffer));
    }

    if (amount === 1) {
      return strings[0];
    }

    return strings;
  }
}
