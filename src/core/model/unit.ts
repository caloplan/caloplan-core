export interface UnitNumber {
  unit: string;
  value: number;
}

export interface CentiMeter extends UnitNumber {
  unit: "cm";
  value: number;
}

export interface KiloGram extends UnitNumber {
  unit: "kg";
  value: number;
}

export interface Gram extends UnitNumber {
  unit: "g";
  value: number;
}

export interface KiloCalorie extends UnitNumber {
  unit: "kcal";
  value: number;
}
