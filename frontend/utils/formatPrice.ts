export const formatPrice = (amount: number): string =>
  `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
