import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { HostedBankProvider } from "../../lib/bank-payments/provider";
export class TbcPaymentProvider extends HostedBankProvider {
  static identifier = "tbc";
}
export default ModuleProvider(Modules.PAYMENT, { services: [TbcPaymentProvider] });
