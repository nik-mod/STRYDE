import { MedusaService } from "@medusajs/framework/utils";
import { PaymentOperation } from "./models/payment-operation";
export default class PaymentOperationsService extends MedusaService({ PaymentOperation }) {}
