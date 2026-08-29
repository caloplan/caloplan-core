import type { DateTime } from "luxon";
import type { Unit } from "./Util.js";

export interface UserExtend {
  age: number;
  height: Unit;
  weight: Unit;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  service_name: string;
  created_time: DateTime;
  updated_at: DateTime;
  profile: UserExtend;
}

