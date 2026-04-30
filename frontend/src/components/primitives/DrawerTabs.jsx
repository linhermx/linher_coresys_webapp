import { focusElementById, getNextHorizontalTabIndex } from '../../utils/tabNavigation.js';

export const DrawerTabs = ({
  label,
  tabs,
  activeKey,
  onChange,
  className = 'ticket-detail__tabs'
}) => {
  const handleTabKeyDown = (event, currentKey, customOnKeyDown) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === currentKey);
    const nextIndex = getNextHorizontalTabIndex(tabs.length, currentIndex, event.key);

    if (nextIndex === null) {
      customOnKeyDown?.(event);
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) {
      return;
    }

    onChange(nextTab.key);
    focusElementById(nextTab.id);
  };

  return (
    <div
      className={className}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={tab.id}
            aria-selected={isActive}
            aria-controls={tab.controls}
            tabIndex={isActive ? 0 : -1}
            className={`ticket-detail__tab ${isActive ? 'ticket-detail__tab--active' : ''}`}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.key, tab.onKeyDown)}
            ref={tab.ref}
          >
            <span data-role="label">{tab.label}</span>
            {typeof tab.count === 'number' ? <span data-role="count">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
};
