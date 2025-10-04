// src/utils/formatter.js

export const formatCurrency = (amount, currencySymbol) => {
  if (typeof amount !== 'number') amount = 0;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${currencySymbol} ${formatter.format(amount)}`;
};