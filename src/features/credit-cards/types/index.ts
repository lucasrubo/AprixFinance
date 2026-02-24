export type CardBandeira =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "outro";

export interface CreditCard {
  id: string;
  user_id: string;
  nome: string;
  bandeira: CardBandeira;
  ultimos_4_digitos: string;
  limite: number | null;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
  cor: string;
  ativo: boolean;
  created_at: string;
}

export interface CreateCreditCardData {
  nome: string;
  bandeira: CardBandeira;
  ultimos_4_digitos: string;
  limite?: number;
  dia_fechamento?: number;
  dia_vencimento?: number;
  cor?: string;
}

export interface CreditCardStats extends CreditCard {
  total_mes: number;
  percentual_limite: number | null;
}
