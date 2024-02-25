import { ChainableCommander } from "ioredis";
import { BaseBenchmark } from "./benchmark";

export default class SetPerPrefix extends BaseBenchmark {
  protected scoreSetPrefix = `${this.options.keyPrefix}:scores` as const;

  protected keys: Set<string> = new Set();

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
            const completionPrefix = completion.slice(0, j + 1);
            const key = `${thiz.scoreSetPrefix}:${completionPrefix}`;
            thiz.keys.add(key);

            yield (pipeline: ChainableCommander) => {
              pipeline.zadd(key, score, completion);
            };
          }
        }
      })(this)
    );
  }
}
