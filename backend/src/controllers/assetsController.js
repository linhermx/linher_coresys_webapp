import {
  createInventoryRecord,
  listInventory,
} from "./inventoryController.js";

// Alias técnico temporal para la ruta legacy /assets.
export const listAssets = listInventory;
export const createAsset = createInventoryRecord;
