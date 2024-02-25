import { ChainableCommander } from "ioredis";
import { BaseBenchmark } from "./benchmark";

export default class SingleSet extends BaseBenchmark {
  protected scoreSetPrefix = `${this.options.keyPrefix}:scores` as const;

  async initialize(): Promise<void> {
    await this.connected;

    const completions = this.generateCJK(
      this.options.maxKeyLength,
      this.options.initKeys
    );
    const scores = completions.map(() => Math.floor(Math.random() * 10000));

    this.keys.add(this.scoreSetPrefix);

    await this.batchedPipeline(
      (function* (thiz: SingleSet) {
        for (let i = 0; i < completions.length; i++) {
          const completion = completions[i];
          const score = scores[i];

          yield (pipeline: ChainableCommander) => {
            pipeline.zadd(thiz.scoreSetPrefix, score, completion);
          };
        }
      })(this)
    );
  }
}
