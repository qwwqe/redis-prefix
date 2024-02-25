import SetPerPrefix from "./setperprefix";
import Benchmark from "./benchmark";
import CompressedSetPerPrefix from "./compressedsetperprefix";
import SingleSet from "./singleset";

async function run(benchmark: Benchmark) {
  await benchmark.initialize();
  const memoryUsage = await benchmark.memoryUsage();
  const deletedKeys = await benchmark.cleanUp();

  console.log(
    `Memory usage: ${Math.floor((memoryUsage / 1024 / 1024) * 100) / 100} MB`
  );
  console.log(`Deleted keys: ${deletedKeys}`);
}

const commands: { [command: string]: () => any } = {
  setPerPrefix: () => run(new SetPerPrefix()),
  compressedSetPerPrefix: () => run(new CompressedSetPerPrefix()),
  singleSet: () => run(new SingleSet()),
};

if (process.argv[2] in commands) {
  const command = process.argv[2];
  commands[command]();
}
