import { ChainableCommander } from "ioredis";
import { BaseBenchmark } from "./benchmark";

export default class SetPerPrefix extends BaseBenchmark {
  private scoreSetName = `${this.options.keyPrefix}:scores` as const;

  private keys: Set<string> = new Set([this.scoreSetName]);

  async initialize(): Promise<void> {
    await this.connected;

    const completions = this.generateCJK(
      this.options.maxKeyLength,
      this.options.initKeys
    );
    const scores = completions.map(() => Math.floor(Math.random() * 10000));

    await this.batchedPipeline(
      (function* (thiz: SetPerPrefix) {
        for (let i = 0; i < completions.length; i++) {
          const completion = completions[i];
          const score = scores[i];

          for (let j = 0; j < completion.length; j++) {
            const prefix = completion.slice(0, j + 1);
            const key = `${thiz.options.keyPrefix}:${prefix}`;
            thiz.keys.add(key);

            yield (pipeline: ChainableCommander) => {
              pipeline.zadd(thiz.scoreSetName, score, key);
            };
          }
        }
      })(this)
    );
  }

  async memoryUsage(): Promise<number> {
    return 0;
  }

  async cleanUp(): Promise<number> {
    return 0;
  }
}
