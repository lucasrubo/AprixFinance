import { getCreditCardsAction } from "@/features/credit-cards/actions/credit-card-actions";
import { CreditCardsClient } from "./credit-cards-client";

export default async function CreditCardsPage() {
  const result = await getCreditCardsAction();
  const cards = result.data ?? [];

  return <CreditCardsClient initialCards={cards} />;
}
