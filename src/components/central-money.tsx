import { CentralPayoutAccount } from "./central-payout-account";
import { SellerPayouts } from "./seller-payouts";
import { BankAccount } from "./bank-account";

export function CentralMoney({
  tenant,
  tab = false,
  bank = false,
}: {
  tenant?: string;
  tab?: boolean;
  bank?: boolean;
}) {
  return (
    <CentralPayoutAccount tenant={tenant} bank={bank}>
      {(scope) =>
        bank ? (
          <BankAccount key={JSON.stringify(scope)} {...scope} />
        ) : (
          <SellerPayouts
            key={JSON.stringify(scope)}
            {...scope}
            central
            inTab={tab}
          />
        )
      }
    </CentralPayoutAccount>
  );
}
