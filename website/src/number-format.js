const formatters = new Map();

export function formatDecimal(value, fractionDigits) {
  if (!formatters.has(fractionDigits)) {
    formatters.set(fractionDigits, new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    }));
  }
  return formatters.get(fractionDigits).format(value);
}
