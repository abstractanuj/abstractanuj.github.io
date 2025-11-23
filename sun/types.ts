export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export enum TimerMode {
  FOCUS = 'FOCUS',
  BREAK = 'BREAK',
}

export interface JournalPrompt {
  topic: string;
  context: string;
}

export type GridSize = 'small' | 'medium' | 'large' | 'tall';