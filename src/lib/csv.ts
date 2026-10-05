// Quote every cell and neutralize spreadsheet formulas in user-entered text.
export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function resultsCsv(rows: unknown[][]) {
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
