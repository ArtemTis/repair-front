import type { IDevice } from "../types";

export const AI_DETECTED_DEVICE_MODEL = "Определено ИИ";

export function formatDeviceName(
  device: Pick<IDevice, "device_type" | "brand" | "model">
): string {
  return [device.device_type, device.brand, device.model === AI_DETECTED_DEVICE_MODEL ? null : device.model]
    .filter(Boolean)
    .join(" · ");
}
