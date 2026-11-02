import { Shell } from "@/components/Shell";
export default function NotFound() {
  return (
    <Shell>
      <section className="commerce-panel">
        <h1>A different turn.</h1>
        <p>This page could not be found.</p>
        <a className="button button-dark" href="/collections/all">
          Explore the collection ↗
        </a>
      </section>
    </Shell>
  );
}
