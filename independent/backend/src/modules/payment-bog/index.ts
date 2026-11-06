import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { HostedBankProvider } from "../../lib/bank-payments/provider";
export class BogPaymentProvider extends HostedBankProvider {
  static identifier = "bog";
}
export default ModuleProvider(Modules.PAYMENT, { services: [BogPaymentProvider] });
