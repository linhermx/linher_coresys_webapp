import { telephonyModel } from "../models/telephonyModel.js";

export const getTelephonyBlueprint = () => ({
  model: telephonyModel,
  subflows: ["lines", "sims", "recharges"],
  carriers: ["pending-definition"],
  monitoringMode: "operational-placeholder",
});
