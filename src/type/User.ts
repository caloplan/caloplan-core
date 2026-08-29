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

/**
 * id: int
    username: str
    email: EmailStr
    full_name: str | None
    service_name: str
    created_at: datetime
    updated_at: datetime | None
 */
