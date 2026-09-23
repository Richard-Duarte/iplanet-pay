import { Pill } from "@/components/ui/pill";
import {
  STATUS_LABEL,
  STATUS_TONE,
  type ReservationStatus,
} from "@/lib/reservations/types";

export function ReservationStatusPill({ status }: { status: ReservationStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}
