import type { ScanResponse } from "@scout/shared";

export const LAST_SCAN_KEY = "lastScan";

export type ScanState =
  | { status: "pending"; startedAt: number }
  | { status: "done"; scan: ScanResponse; completedAt: number }
  | { status: "error"; message: string; completedAt: number };

export async function setScanState(state: ScanState): Promise<void> {
  await chrome.storage.local.set({ [LAST_SCAN_KEY]: state });
}

export async function getScanState(): Promise<ScanState | undefined> {
  const result = await chrome.storage.local.get(LAST_SCAN_KEY);
  return result[LAST_SCAN_KEY] as ScanState | undefined;
}
