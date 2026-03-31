import { useMemo, useState } from "react";
import Badge from "../primitives/Badge.jsx";
import Card from "../primitives/Card.jsx";
import PageHeader from "../primitives/PageHeader.jsx";
import Tabs from "../primitives/Tabs.jsx";

function ModuleScaffold({
  badgeLabel = "Fase 1",
  badgeTone = "neutral",
  description,
  eyebrow,
  panelIdPrefix,
  sections,
  title,
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.value ?? "");

  const currentSection = useMemo(
    () => sections.find((section) => section.value === activeSection) ?? sections[0],
    [activeSection, sections],
  );

  const tabItems = sections.map(({ value, label, meta }) => ({
    value,
    label,
    meta,
  }));

  return (
    <div className="page-section module-view">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Badge tone={badgeTone}>{badgeLabel}</Badge>}
      />

      <Card
        className="module-view__shell"
        title={currentSection.title}
        description={currentSection.description}
      >
        <div className="module-view__controls">
          <Tabs
            ariaLabel={`Secciones del módulo ${title}`}
            items={tabItems}
            value={activeSection}
            onChange={setActiveSection}
            panelIdPrefix={panelIdPrefix}
          />
        </div>

        <div
          id={`${panelIdPrefix}-${currentSection.value}`}
          role="tabpanel"
          aria-labelledby={`${panelIdPrefix}-tab-${currentSection.value}`}
          className="module-view__panel"
        >
          <div className="module-view__summary">
            {currentSection.summary.map((item) => (
              <article key={item.label} className="module-view__summary-card">
                <span className="module-view__summary-label">{item.label}</span>
                <strong className="module-view__summary-value">{item.value}</strong>
                <span className="module-view__summary-note">{item.note}</span>
              </article>
            ))}
          </div>

          <div className="module-view__grid">
            <section className="module-view__section">
              <div className="module-view__section-header">
                <h3 className="module-view__section-title">Subflujos</h3>
              </div>

              <div className="module-view__tile-grid">
                {currentSection.flows.map((flow) => (
                  <article key={flow.title} className="module-view__tile">
                    <span className="module-view__tile-meta">{flow.meta}</span>
                    <h4 className="module-view__tile-title">{flow.title}</h4>
                    <div className="module-view__chip-list">
                      {flow.items.map((item) => (
                        <span key={item} className="module-view__chip">
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="module-view__section">
              <div className="module-view__section-header">
                <h3 className="module-view__section-title">Primer corte</h3>
              </div>

              <ul className="module-view__checklist">
                {currentSection.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ModuleScaffold;
