import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Arrow, CollectionClosing } from "@/components/Information";
import { findEditorialProduct } from "@/lib/editorial-catalog";
export const metadata: Metadata = { title: "About", description: "The STRYDE point of view. Design, movement and footwear culture." };
export default function About() {
  const pairs = ["stockx-0001", "stockx-0002", "stockx-0005"].map(findEditorialProduct).filter(p => p !== undefined);
  return <Shell><div className="information-page about-page" data-information>
    <section className="about-opening"><h1>A point<br />of <em>view.</em></h1><div className="about-opening-copy"><p>The profile. The materials. The way a pair changes an outfit.</p><p>STRYDE is a place to look closer at footwear—and find your own direction.</p><a href="#our-perspective" className="information-back">The STRYDE perspective <Arrow diagonal /></a></div>
      <div className="about-lineup" aria-label="Footwear from the STRYDE collection">{pairs.map((pair, i) => <a key={pair.id} href={pair.url} className={`about-pair about-pair-${i}`}><div data-about-shoe><img src={pair.photos[0].src} data-photo-bounds={pair.photos[0].bounds?.join(",")} alt={pair.title} width="900" height="650" fetchPriority={i === 0 ? "high" : "auto"} /></div><span>{pair.brand}<span>{pair.title}<Arrow diagonal /></span></span></a>)}</div>
    </section>
    <section className="about-perspective" id="our-perspective" data-info-reveal><h2>Good design<br />goes <em>somewhere.</em></h2><div><p>A court silhouette worn far from the court. A trail runner taken into the city. Familiar shapes, seen differently.</p><p>That space between design and everyday life is what interests us. Not a single uniform. A point of view you make your own.</p></div></section>
    <section className="about-culture"><div className="about-culture-title" data-info-reveal><h2>Made to move.<br /><em>Chosen to stay.</em></h2><p>Three things we keep coming back to.</p></div><div className="about-principles">
      <section data-info-reveal><h3>The shape</h3><p>A low profile, an unexpected curve, a proportion that feels right. Start with the silhouette.</p></section>
      <section data-info-reveal><h3>The details</h3><p>Mesh against leather. A line across the upper. Texture and contrast make the difference up close.</p></section>
      <section data-info-reveal><h3>The context</h3><p>Footwear carries its history into new places. How you wear a pair is part of its next chapter.</p></section>
    </div></section>
    <CollectionClosing />
  </div></Shell>;
}
