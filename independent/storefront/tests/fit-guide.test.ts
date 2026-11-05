import { test } from "node:test";
import assert from "node:assert/strict";
import { fitChartFor, brandFitCharts, productFitCharts, type FitChart } from "../src/lib/fit-guide";
test("fit guidance never infers an unverified conversion",()=> {
 assert.equal(fitChartFor(),null); assert.equal(fitChartFor("Nike","unknown"),null);
 assert.equal(fitChartFor("constructor", "__proto__"),null);
});
test("verified product chart overrides a brand reference",()=> {
 const brand:FitChart={label:"Test brand",source:"verified test source",verifiedAt:"2026-11-05",rows:[]};
 const product={...brand,label:"Exact model"}; brandFitCharts.test=brand; productFitCharts.exact=product;
 try { assert.equal(fitChartFor("TEST"),brand); assert.equal(fitChartFor("test","exact"),product); } finally { delete brandFitCharts.test; delete productFitCharts.exact; }
});
