"use client";
import { useId, useState } from "react";
export interface FaqGroup { id: string; title: string; questions: { question: string; answer: React.ReactNode }[] }
export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const prefix = useId();
  const [open, setOpen] = useState<string[]>([]);
  return <div className="faq-groups">{groups.map(group => <section id={group.id} key={group.id} className="faq-group"><h2>{group.title}</h2>{group.questions.map((item, index) => {
    const id = `${prefix}-${group.id}-${index}`;
    const expanded = open.includes(id);
    return <div className={`faq-item ${expanded ? "is-open" : ""}`} key={id}><h3><button id={`${id}-question`} type="button" aria-expanded={expanded} aria-controls={`${id}-answer`} onClick={() => setOpen(value => expanded ? value.filter(key => key !== id) : [...value, id])}>{item.question}<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14" /><path className="faq-plus" d="M12 5v14" /></svg></button></h3><div id={`${id}-answer`} role="region" aria-labelledby={`${id}-question`} className="faq-answer" inert={!expanded} aria-hidden={!expanded}><div><div className="faq-answer-copy">{item.answer}</div></div></div></div>;
  })}</section>)}</div>;
}
