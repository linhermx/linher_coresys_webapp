export const PaginationBar = ({
  ariaLabel,
  start,
  end,
  total,
  pageSize,
  pageSizeOptions,
  pageSizeId,
  pageSizeName,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPrev,
  onNext
}) => (
  <nav className="data-table__pagination" aria-label={ariaLabel}>
    <div className="data-table__pagination-meta">
      <p className="data-table__pagination-summary">
        Mostrando <strong>{start}</strong>-<strong>{end}</strong> de <strong>{total}</strong>
      </p>

      <label className="data-table__page-size" htmlFor={pageSizeId}>
        <span>Por página</span>
        <select
          id={pageSizeId}
          name={pageSizeName}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="data-table__pagination-actions">
      <button
        type="button"
        className="data-table__pagination-button"
        onClick={onPrev}
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      <span className="data-table__pagination-page" aria-live="polite" aria-atomic="true">
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>
      <button
        type="button"
        className="data-table__pagination-button"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </div>
  </nav>
);
