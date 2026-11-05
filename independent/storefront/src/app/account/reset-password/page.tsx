import { Shell } from "@/components/Shell";
import { AccountRecovery } from "@/components/AccountRecovery";
export const metadata={title:"Reset your password",robots:{index:false,follow:false}};
export default function Page(){return <Shell><AccountRecovery reset/></Shell>;}
