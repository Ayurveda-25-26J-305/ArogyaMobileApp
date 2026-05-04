export type MedicineForm = {
  disease: string;
  agni: string;
  region: string;
  gender: string;
  age: string;
  vata: string;
  pitta: string;
  kapha: string;
  ama: string;
  mucus: string;
  dryness: string;
  heat: string;
  pain: string;
};

export type PredictedHerbs = {
  primary: PredictedHerb;
  secondary: string;
  tertiary: string;
} | null;

export type DoshaScores = {
  vata: number;
  pitta: number;
  kapha: number;
} | null;
