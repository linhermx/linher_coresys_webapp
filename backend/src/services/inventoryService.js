import { assetModel } from "../models/assetModel.js";
import { inventoryModel } from "../models/inventoryModel.js";

export const getInventoryBlueprint = () => ({
  model: inventoryModel,
  sourceEntities: [assetModel.entity, ...inventoryModel.relatedEntities],
  subflows: ["assets", "custody", "assignments"],
  assignmentModes: ["user", "area", "stock"],
});
