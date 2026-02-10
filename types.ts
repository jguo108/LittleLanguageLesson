export interface DetectedObject {
  id: string;
  label: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface WordDetails {
  word: string;
  phonetic?: string;
  definitions?: string[];
  sentences: string[];
}

export enum AppState {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  DETAIL = 'DETAIL',
  WORDBOOK = 'WORDBOOK',
  PROFILE = 'PROFILE',
}

export interface UserProfile {
  name: string;
  email: string;
  photoFileName: string;
}