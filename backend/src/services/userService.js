import { userModel } from "../models/userModel.js";
import { getRbacBlueprint } from "./rbacService.js";

export const getUsersBlueprint = () => ({
  model: userModel,
  filters: ["status", "role", "search"],
  rbac: getRbacBlueprint(),
});

export const getUserProfileBlueprint = (userId) => ({
  id: userId,
  status: "placeholder",
  profile: userModel.fields,
});

