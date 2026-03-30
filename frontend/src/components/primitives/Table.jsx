function Table({ columns, emptyMessage = "Sin datos disponibles.", rows }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align ? `is-${column.align}` : ""}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={row.id ?? `${rowIndex}-${row[columns[0].key]}`}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align ? `is-${column.align}` : ""}
                  >
                    {typeof column.render === "function"
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table__empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

