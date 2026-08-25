import { VehicleAsset } from "@/lib/types";
import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export const vehicles: VehicleAsset[] = [
  {
    id: "civic-2021",
    make: "Honda",
    model: "Civic",
    variant: "Oriel 1.5 Turbo",
    year: 2021,
    purchaseDate: "2021-11-20",
    purchasePrice: 5_650_000,
    currentValue: 4_450_000,
    history: buildTrendSeries(months, 4_450_000, -0.09, 0.02, 51),
  },
  {
    id: "city-2023",
    make: "Honda",
    model: "City",
    variant: "Aspire 1.2",
    year: 2023,
    purchaseDate: "2023-05-08",
    purchasePrice: 4_100_000,
    currentValue: 3_780_000,
    history: buildTrendSeries(months, 3_780_000, -0.06, 0.015, 52),
  },
];

export function vehicleById(id: string): VehicleAsset | null {
  return vehicles.find((v) => v.id === id) ?? null;
}
