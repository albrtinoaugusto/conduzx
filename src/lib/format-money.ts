export function formatMoneyMzn(valueCents: number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
  }).format(valueCents / 100);
}
