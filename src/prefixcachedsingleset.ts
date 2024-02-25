import { ChainableCommander } from "ioredis";
import { BaseBenchmark } from "./benchmark";

export default class PrefixCachedSingleSet extends BaseBenchmark {
  protected prefixCacheLength = 2;

  protected scoreSetPrefix = `${this.options.keyPrefix}:scores` as const;

  protected cachedScoreSetPrefix =
    `${this.options.keyPrefix}:cachedScores` as const;

  async initialize(): Promise<void> {
    await this.connected;

    const completions = this.generateCJK(
      this.options.maxKeyLength,
      this.options.initKeys
    );
    const scores = completions.map(() => Math.floor(Math.random() * 10000));

    this.keys.add(this.scoreSetPrefix);

    await this.batchedPipeline(
      (function* (thiz: PrefixCachedSingleSet) {
        for (let i = 0; i < completions.length; i++) {
          const completion = completions[i];
          const score = scores[i];

          for (let j = 0; j < thiz.prefixCacheLength; j++) {
            const prefix = completion.slice(0, j + 1);
            const key = `${thiz.cachedScoreSetPrefix}:${prefix}`;

            thiz.keys.add(key);

            yield (pipeline: ChainableCommander) => {
              pipeline.zadd(key, score, completion);
            };
          }

          if (completion.length > thiz.prefixCacheLength) {
            yield (pipeline: ChainableCommander) => {
              pipeline.zadd(thiz.scoreSetPrefix, 0, `${completion}:${score}`);
            };
          }
        }
      })(this)
    );
  }

  // async getCompletions(query: string, amount: number): string[] {
  //   if (query.length === 0) {
  //     return [];
  //   }

  //   if (query.length <= this.prefixCacheLength) {
  //     const key = `${this.cachedScoreSetPrefix}:${query}`;
  //     const results = await this.redis.zrangebyscore(key, min, max)
  //   }
  // }
}
