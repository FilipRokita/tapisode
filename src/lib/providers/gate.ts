/** Asked before every call a provider makes. It throws when the app must not call the provider right now. */
export interface RequestGate {
  acquire(): Promise<void>;
  /** The provider said to slow down. No calls until the pause ends. */
  pause(seconds: number): Promise<void>;
}

export class CatalogBusyError extends Error {
  constructor() {
    super("CATALOG_BUSY");
    this.name = "CatalogBusyError";
  }
}

export const openGate: RequestGate = { acquire: async () => {}, pause: async () => {} };
