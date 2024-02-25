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

  protected keys: Set<string> = new Set();

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

  async memoryUsage(): Promise<number> {
    const results = await this.batchedPipeline(
      (function* (thiz: BaseBenchmark) {
        for (const key of thiz.keys.values()) {
          yield (pipeline: ChainableCommander) => {
            pipeline.memory("USAGE", key);
          };
        }
      })(this)
    );

    const totalUsage = results.reduce(
      (sum, [err, value]) => (err ? sum : sum + value),
      0
    );

    return totalUsage;
  }

  async cleanUp(): Promise<number> {
    const results = await this.batchedPipeline(
      (function* (thiz: BaseBenchmark) {
        for (const key of thiz.keys.values()) {
          yield (pipeline: ChainableCommander) => {
            pipeline.del(key);
          };
        }
      })(this)
    );

    const totalDeleted = results.reduce(
      (sum, [err, value]) => (err ? sum : sum + value),
      0
    );

    return totalDeleted;
  }

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
    const totalResults: [err: Error | null, result: any][] = [];

    for (const pipelineCall of generator) {
      pipelineCall(pipeline);

      if (pipeline.length >= this.options.pipelineBatchSize) {
        const results = (await pipeline.exec()) || [];
        results.forEach(([err, value]) => {
          if (err) {
            console.warn(`Pipeline error: ${err} (${value})`);
          }
        });
        totalResults.push(...results);
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
      totalResults.push(...results);
    }

    return totalResults;
  }
}
