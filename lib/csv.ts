type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
    if (value === null || value === undefined)
        return '';
    let text = String(value);
    // A leading = + - @ would be run as a formula by spreadsheet programs.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text))
        text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel shows accents correctly. */
export function toCsv(headers: string[], rows: Cell[][]): string {
    const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
    return `﻿${lines.join('\r\n')}\r\n`;
}
