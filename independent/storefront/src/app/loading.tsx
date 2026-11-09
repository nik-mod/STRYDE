import { Shell } from "@/components/Shell";

export default function Loading() {
  return (
    <Shell enhance={false}>
      <div className="shop-page route-loading">
        <p role="status">Loading page…</p>
      </div>
    </Shell>
  );
}

