
export interface DispatchQueue {
  nativeEvent: Event,
  listeners: Listener[],
}

export interface Listener {
  (event?: Event): void;
}