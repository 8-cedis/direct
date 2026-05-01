"use client";

export default function DataTable({ columns, rows, onRowClick, emptyText = "No records found." }) {
  if (!rows.length) {
    return <div className="fd-card">{emptyText}</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="fd-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.width ? { width: column.width } : undefined}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
