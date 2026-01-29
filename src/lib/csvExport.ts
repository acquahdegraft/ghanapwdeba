// CSV Export utilities for admin dashboard

interface ExportableData {
  [key: string]: string | number | boolean | null | undefined;
}

function escapeCSVValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  const stringValue = String(value);
  
  // If the value contains commas, quotes, or newlines, wrap it in quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    // Escape any existing quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

export function exportToCSV<T extends ExportableData>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    return;
  }

  // Create header row
  const headers = columns.map((col) => escapeCSVValue(col.label)).join(",");

  // Create data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeCSVValue(row[col.key])).join(",")
  );

  // Combine headers and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDateForExport(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatAmountForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `GHS ${amount.toFixed(2)}`;
}
