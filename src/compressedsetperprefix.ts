import { ChainableCommander } from "ioredis";
import { BaseBenchmark } from "./benchmark";

export default class CompressedSetPerPrefix extends BaseBenchmark {
  protected scoreSetPrefix = `${this.options.keyPrefix}:scores` as const;

  protected scoreSetLookupKey = `${this.options.keyPrefix}:scoreLookup`;

  protected scoreSetCount = new Map<string, number>();

  protected keys: Set<string> = new Set([this.scoreSetLookupKey]);

  async initialize(): Promise<void> {
    await this.connected;

    const completions = this.generateCJK(
      this.options.maxKeyLength,
      this.options.initKeys
    );
    const scores = completions.map(() => Math.floor(Math.random() * 10000));

    await this.batchedPipeline(
      (function* (thiz: CompressedSetPerPrefix) {
        for (let i = 0; i < completions.length; i++) {
          const completion = completions[i];
          const score = scores[i];

          const commonSortedSetKey = `${thiz.scoreSetPrefix}:${completion}`;

          const commonCount = thiz.scoreSetCount.get(commonSortedSetKey) || 0;

          if (commonCount > 1) {
          } else if (commonCount === 1) {
          } else {
            thiz.scoreSetCount.set(commonSortedSetKey, 1);

            yield (pipeline: ChainableCommander) => {
              pipeline.zadd(commonSortedSetKey, score, completion);
            };

            for (let j = 0; j < completion.length; j++) {
              const completionPrefix = completion.slice(0, j + 1);
              const key = `${thiz.scoreSetPrefix}:${completionPrefix}`;
              thiz.keys.add(key);

              yield (pipeline: ChainableCommander) => {
                pipeline.hset(thiz.scoreSetLookupKey, key, commonSortedSetKey);
              };
            }
          }
        }
      })(this)
    );
  }
}
