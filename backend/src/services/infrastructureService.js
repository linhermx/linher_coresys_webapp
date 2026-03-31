import { infrastructureModel } from "../models/infrastructureModel.js";

export const getInfrastructureBlueprint = () => ({
  model: infrastructureModel,
  subflows: ["network", "devices", "operations"],
  transversalLayers: ["calendar", "audit", "notifications"],
});
