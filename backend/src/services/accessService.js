import { accessModel } from "../models/accessModel.js";

export const getAccessBlueprint = () => ({
  model: accessModel,
  subflows: ["accounts", "review", "history"],
  sensitivity: "rbac-protected",
  permissionKey: "access.view_sensitive",
});
