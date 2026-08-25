import { VehicleAsset } from "@/lib/types";

export const vehicles: VehicleAsset[] = [];

export function vehicleById(id: string): VehicleAsset | null {
  return vehicles.find((v) => v.id === id) ?? null;
}
