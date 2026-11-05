import { Shell } from "@/components/Shell";
export const metadata = { title: "Size guide" };
const ROWS: [string, string, string, string][] = [
  ["EU 40", "US 7", "UK 6", "25.0 cm"],
  ["EU 41", "US 8", "UK 7", "25.8 cm"],
  ["EU 42", "US 9", "UK 8", "26.7 cm"],
  ["EU 43", "US 10", "UK 9", "27.5 cm"],
];
export default function SizeGuide() {
  return (
    <Shell>
      <section className="commerce-panel">
        <h1>Size guide.</h1>
        <p>
          STRYDE pairs run true to size in EU sizing. Measure your foot from
          heel to longest toe in the evening, standing, and pick the closest
          size — when in doubt, take the larger one.
        </p>
        <table className="size-table">
          <thead>
            <tr>
              <th scope="col">EU</th>
              <th scope="col">US (men)</th>
              <th scope="col">UK</th>
              <th scope="col">Foot length</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Between sizes or wide feet? Go half a size up. The sculpted midsole
          has a roomy forefoot; the heel cage locks without pressure.
        </p>
        <p>
          <a href="/collections/all">Back to the collection ↗</a>
        </p>
      </section>
    </Shell>
  );
}
