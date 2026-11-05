export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16M13 5l7 7-7 7"} /></svg>;
}
export function CollectionClosing() {
  return <section className="information-closing" data-info-reveal><h2>Find your<br /><em>next pair.</em></h2><a href="/collections/all" className="information-action">Explore the collection <Arrow /></a></section>;
}
