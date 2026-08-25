import { OtherAsset } from "@/lib/types";

export const otherAssets: OtherAsset[] = [];

export const othersTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
