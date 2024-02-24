import { BaseBenchmark } from "./benchmark";

export default class SetPerPrefix extends BaseBenchmark {
    async initialize(): Promise<void> {
        const values = this.generateCJK(
            this.options.maxKeyLength,
            this.options.initKeys
        );
    }
}
