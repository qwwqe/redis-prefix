import SetPerPrefix from "./setperprefix";
import Benchmark from "./benchmark";

async function setPerPrefix() {
  const benchmark: Benchmark = new SetPerPrefix();

  await benchmark.initialize();
  const memoryUsage = await benchmark.memoryUsage();
  const deletedKeys = await benchmark.cleanUp();

  console.log(`Memory usage: ${memoryUsage}`);
  console.log(`Deleted keys: ${deletedKeys}`);
}

setPerPrefix();
