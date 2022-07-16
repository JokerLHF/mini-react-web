export enum ReactExpirationTime {
  NoWork = 0,
  Never = 1,
  Idle = 2,
  Sync = Math.pow(2, 30), // 1073741824, 大概 12.5 天
  Batched = Sync - 1,
}