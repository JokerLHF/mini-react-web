import { ReactExpirationTime } from "./interface";

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = ReactExpirationTime.Batched - 1;

// 10ms内产生的update有同样的过期时间，这样可以把多个update在一次处理
// 越快过期的 expirationTime 越大
export const msToExpirationTime = (ms: number) => {
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}

export const expirationTimeToMs = (expirationTime: number) => {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}