import { getInventoryBlueprint } from "./inventoryService.js";

// Alias técnico temporal para mantener compatibilidad mientras el dominio visible ya es inventory.
export const getAssetModuleBlueprint = () => getInventoryBlueprint();
