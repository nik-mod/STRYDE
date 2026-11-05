// Publish verified charts here only after checking the exact merchandise.
// A product override takes precedence over its brand. Never infer conversions.
export interface FitChart {
  label: string;
  source: string;
  verifiedAt: string;
  rows: { eu: string; us: string; uk: string; footLength: string }[];
}
export const brandFitCharts: Record<string, FitChart> = {};
export const productFitCharts: Record<string, FitChart> = {};
export function fitChartFor(brand?: string, product?: string): FitChart | null {
  const brandKey = brand?.trim().toLowerCase();
  return (product && Object.hasOwn(productFitCharts, product) && productFitCharts[product]) || (brandKey && Object.hasOwn(brandFitCharts, brandKey) && brandFitCharts[brandKey]) || null;
}
