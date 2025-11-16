
export type Point = {
  x: number;
  secretY: number | null;
  userY: number | null;
};

export type Slider = {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
};

export interface SecretFunction {
  expression: string;
  evaluate: (x: number) => number;
}

export enum GameState {
  Playing = 'PLAYING',
  Won = 'WON',
  Revealed = 'REVEALED',
}
