export function formatMoneyMzn(valueCentavos: number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
  }).format(valueCentavos / 100);
}
