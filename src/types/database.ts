import type { UserRole } from "./auth";

export interface Store {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
}

export type { UserRole };
