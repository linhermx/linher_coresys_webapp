import { useId } from "react";

function Tabs({
  ariaLabel = "Secciones",
  className = "",
  items,
  onChange,
  panelIdPrefix,
  value,
}) {
  const generatedId = useId();
  const resolveTabId = (itemValue) =>
    panelIdPrefix
      ? `${panelIdPrefix}-tab-${itemValue}`
      : `${generatedId}-${itemValue}`;

  const handleKeyDown = (event, currentIndex) => {
    const navigationKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];

    if (!navigationKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    const nextValue = items[nextIndex].value;
    onChange(nextValue);

    requestAnimationFrame(() => {
      document.getElementById(resolveTabId(nextValue))?.focus();
    });
  };

  return (
    <div className={`tabs ${className}`.trim()}>
      <div className="tabs__list" role="tablist" aria-label={ariaLabel}>
        {items.map((item, index) => {
          const tabId = resolveTabId(item.value);
          const panelId = panelIdPrefix
            ? `${panelIdPrefix}-${item.value}`
            : undefined;
          const isActive = item.value === value;

          return (
            <button
              key={item.value}
              id={tabId}
              type="button"
              role="tab"
              className={`tabs__tab ${isActive ? "is-active" : ""}`}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="tabs__tab-label">{item.label}</span>
              {item.meta ? <span className="tabs__tab-meta">{item.meta}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;
