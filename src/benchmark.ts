import Redis, { ChainableCommander } from "ioredis";

export default interface Benchmark {
  initialize(): Promise<void>;
  memoryUsage(): Promise<number>;
  cleanUp(): Promise<number>;
}

export type Options = {
  maxKeyLength: number;
  initKeys: number;
  keyPrefix: string;
  pipelineBatchSize: number;
};

export const DefaultOptions: Options = {
  maxKeyLength: 15,
  initKeys: 100000,
  keyPrefix: "benchmark",
  pipelineBatchSize: 10000,
};

export abstract class BaseBenchmark implements Benchmark {
  options: Options;

  redis: Redis;

  connected: Promise<boolean>;

  constructor(options?: Partial<Options>) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };

    this.redis = new Redis();
    this.connected = new Promise((resolve) =>
      this.redis.on("connect", resolve)
    );
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

  async batchedPipeline(
    generator: Generator<(pipeline: ChainableCommander) => any>
  ) {
    let pipeline = this.redis.pipeline();

    for (const pipelineCall of generator) {
      pipelineCall(pipeline);

      if (pipeline.length >= this.options.pipelineBatchSize) {
        const results = (await pipeline.exec()) || [];
        results.forEach(([err, value]) => {
          if (err) {
            console.warn(`Pipeline error: ${err} (${value})`);
          }
        });
        pipeline = this.redis.pipeline();
      }
    }

    if (pipeline.length) {
      const results = (await pipeline.exec()) || [];
      results.forEach(([err, value]) => {
        if (err) {
          console.warn(`Pipeline error: ${err} (${value})`);
        }
      });
    }
  }
}
