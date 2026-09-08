import type { Gram, KiloGram, KiloCalorie, UnitNumber } from "./unit.js";

export interface Nutrition {
  carbon: KiloGram;
  protein: KiloGram;
  fat: KiloGram;
  salt: Gram;
  energy: KiloCalorie;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  image: string;
  unit: UnitNumber;
  nutrition: Nutrition;
  created_time: string;
}
