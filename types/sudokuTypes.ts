export type CellValue = number | null;
export type SelectedCell = { row: number; col: number } | null;
export type BoardState = CellValue[][] | null;
export type SolutionState = number[][] | null;
export type Conflicts = Set<string>; // format: "row-col"

// Define and export DraftMarks type
export type DraftMarks = { [cellKey: string]: Set<number> };
