import type { DateTime } from "luxon";
export type ChatType = "user" | "agent";

export interface Chat {
  id: string;
  type: ChatType;
  content: string;
  created_time: DateTime
}
