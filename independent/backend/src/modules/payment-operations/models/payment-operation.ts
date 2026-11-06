import { model } from "@medusajs/framework/utils";
export const PaymentOperation = model.define("payment_operation", {
  id: model.id().primaryKey(),
  operation_key: model.text().unique(),
  state: model.text(),
  details: model.json(),
});
