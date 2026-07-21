import type { DesktopApi } from "./types.js";
import { createMockApi } from "./mockApi.js";

let mockApi: DesktopApi | null = null;

export function getDesktopApi(): DesktopApi {
  if (window.api) {
    return window.api;
  }
  if (!mockApi) {
    mockApi = createMockApi();
  }
  return mockApi;
}

export function isUsingMockApi(): boolean {
  return !window.api;
}
