export const formatPrice = (amount: number): string =>
  `EGP ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
