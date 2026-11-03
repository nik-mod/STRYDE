// Small reading beats complement the existing product choreography. These
// children have their own transforms; camera gates and pinned stages stay intact.
export function mountEditorialDetails(root, gsap) {
  const copy = root.querySelectorAll('.chapter-intro, .tech-brief, .feat-story, .brand-editor-note, .closing-actions > p');
  for (const element of copy) {
    gsap.fromTo(element, { y: 16, opacity: .45 }, {
      y: 0, opacity: 1, duration: .85, ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 94%', once: true },
    });
  }
  // Flowing mobile sections previously had no heading entrance at all.
  if (root.ownerDocument.defaultView.innerWidth <= 700) {
    const heading = root.querySelector('h2');
    if (heading) gsap.fromTo(heading, { y: 20 }, {
      y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: heading, start: 'top 95%', once: true },
    });
  }
}
