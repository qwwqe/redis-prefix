import Redis from 'ioredis'

export default interface RedisBenchmark {
    initialize(): Promise<void>
    memoryUsage(): Promise<number>
    cleanUp(): Promise<void>
}

export abstract class BaseRedisBenchmark implements RedisBenchmark {
    redis: Redis = new Redis()

    abstract initialize(): Promise<void>

    abstract memoryUsage(): Promise<number>

    abstract cleanUp(): Promise<void>
}
