import type { UsedDeviceOffer } from "@/lib/trade-in/types";

const offers = new Map<string, UsedDeviceOffer>();

function nowIso() {
  return new Date().toISOString();
}

export function mockGetLatestOfferForReservation(
  reservationId: string,
  userId: string,
): UsedDeviceOffer | null {
  let latest: UsedDeviceOffer | null = null;
  for (const offer of offers.values()) {
    if (offer.reservation_id !== reservationId || offer.user_id !== userId) continue;
    if (!latest || offer.created_at > latest.created_at) latest = offer;
  }
  return latest;
}

export function mockInsertOffer(input: {
  userId: string;
  reservationId: string;
  deviceModel: string;
  imei: string;
  expectedCents: number;
  minimumCents: number;
  maintenanceOptions: string[];
  liquidExposure: boolean;
  photoCount: number;
}): { id: string } {
  const id = crypto.randomUUID();
  const offer: UsedDeviceOffer = {
    id,
    user_id: input.userId,
    reservation_id: input.reservationId,
    device_model: input.deviceModel,
    imei: input.imei,
    expected_value_cents: input.expectedCents,
    minimum_value_cents: input.minimumCents,
    maintenance_options: input.maintenanceOptions,
    liquid_exposure: input.liquidExposure,
    photo_paths: Array.from({ length: input.photoCount }, (_, i) => `mock/${id}/${i}.jpg`),
    status: "pending",
    admin_message: null,
    approved_value_cents: null,
    reviewed_at: null,
    created_at: nowIso(),
  };
  offers.set(id, offer);
  return { id };
}

export function mockHasPendingOffer(reservationId: string, userId: string): boolean {
  for (const offer of offers.values()) {
    if (
      offer.reservation_id === reservationId &&
      offer.user_id === userId &&
      offer.status === "pending"
    ) {
      return true;
    }
  }
  return false;
}
