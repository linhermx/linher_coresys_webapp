import { serviceModel } from "../models/serviceModel.js";

export const getServicesBlueprint = () => ({
  model: serviceModel,
  subflows: ["catalog", "payments", "renewals"],
  renewalModes: ["manual", "calendar"],
});
