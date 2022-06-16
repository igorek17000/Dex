import { JsonRpcProvider } from "@ethersproject/providers";

export const waitUntilBlock = (provider: JsonRpcProvider, targetBlockNumber: number) => new Promise<void>((resolve, _) => {
  const listener = (blockNumber: number) => {
    if (blockNumber >= (targetBlockNumber)) {
      resolve();
    }
  };
  provider.on('block', listener);
});