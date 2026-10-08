type Row = { status?: string | null };

/** Intake is off unless the caller is desk review. */
export function agentPlays<T extends Row>(rows: T[], includeIntake = false): T[] {
  if (includeIntake) return rows;
  return rows.filter((row) => String(row.status || "intake").toLowerCase() !== "intake");
}
