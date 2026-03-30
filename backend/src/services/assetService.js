import { assetModel } from "../models/assetModel.js";

export const getAssetModuleBlueprint = () => ({
  model: assetModel,
  categories: ["hardware", "peripheral", "license", "telephony"],
  assignmentModes: ["user", "area", "stock"],
});

