export interface RedisBenchmark {
    initialize(): Promise<void>
    memoryUsage(): Promise<number>
    cleanUp(): Promise<void>
}
