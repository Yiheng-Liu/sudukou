import { CellValue } from "../types/sudokuTypes"; // Assuming types are moved later

// --- Sudoku Generation & Validation Logic ---

// --- Norvig Algorithm Setup ---

function cross(A: string, B: string): string[] {
  const result: string[] = [];
  for (const a of A) {
    for (const b of B) {
      result.push(a + b);
    }
  }
  return result;
}

const digits = "123456789";
export const rows = "ABCDEFGHI";
export const cols = digits;
const squares: string[] = cross(rows, cols); // ['A1', 'A2', ..., 'I9']

const unitlist: string[][] = (() => {
  const list: string[][] = [];
  // Rows
  for (const r of rows) {
    list.push(cross(r, cols));
  }
  // Columns
  for (const c of cols) {
    list.push(cross(rows, c));
  }
  // 3x3 Boxes
  const rowSquares = ["ABC", "DEF", "GHI"];
  const colSquares = ["123", "456", "789"];
  for (const rs of rowSquares) {
    for (const cs of colSquares) {
      list.push(cross(rs, cs));
    }
  }
  return list;
})();

// units['A1'] = [['A1'...'A9'], ['A1'...'I1'], ['A1'...'C3']]
const units: { [s: string]: string[][] } = {};
for (const s of squares) {
  units[s] = unitlist.filter((u) => u.includes(s));
}

// peers['A1'] = squares in the same row, col, box as A1, excluding A1
export const peers: { [s: string]: Set<string> } = {};
for (const s of squares) {
  const unitPeers = new Set<string>();
  for (const unit of units[s]) {
    for (const s2 of unit) {
      if (s2 !== s) {
        unitPeers.add(s2);
      }
    }
  }
  peers[s] = unitPeers;
}
// --- End Norvig Setup ---

// Type for Norvig's board representation
type GridValues = { [s: string]: string }; // e.g., {'A1': '123', 'A2': '4', ...}

// Function to parse a 2D array board into the GridValues format
function parse_grid(board: number[][]): GridValues | null {
  const values: GridValues = {};
  for (const s of squares) {
    values[s] = digits; // Initialize all squares with all digits
  }

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = board[r][c];
      if (digit !== 0 && digit !== null) {
        const s = rows[r] + cols[c];
        if (!assign(values, s, digit.toString())) {
          return null; // Failed early during parsing (contradiction)
        }
      }
    }
  }
  return values;
}

// Assign a value to a square and propagate constraints
function assign(values: GridValues, s: string, d: string): GridValues | null {
  const other_values = values[s].replace(d, "");
  for (const d2 of other_values) {
    if (!eliminate(values, s, d2)) {
      return null; // Contradiction detected during assign
    }
  }
  return values;
}

// Eliminate a value d from square s; propagate when needed
function eliminate(
  values: GridValues,
  s: string,
  d: string
): GridValues | null {
  if (!values[s].includes(d)) {
    return values; // Already eliminated
  }

  values[s] = values[s].replace(d, "");

  // (1) Check for contradiction: If square s is reduced to empty, fail
  if (values[s].length === 0) {
    return null; // Contradiction: removed last value
  }

  // (2) If square s is reduced to one value d2, eliminate d2 from its peers
  if (values[s].length === 1) {
    const d2 = values[s];
    for (const s2 of peers[s]) {
      if (!eliminate(values, s2, d2)) {
        return null; // Contradiction detected during peer elimination
      }
    }
  }

  // (3) Check "Only Choice": If a unit u is reduced such that digit d
  //     has only one possible place left, then assign it there
  for (const u of units[s]) {
    const dplaces = u.filter((s2) => values[s2].includes(d));
    if (dplaces.length === 0) {
      return null; // Contradiction: no place for this digit in unit
    }
    if (dplaces.length === 1) {
      // d can only be in one place in unit; assign it there
      if (!assign(values, dplaces[0], d)) {
        return null; // Contradiction detected during "only choice" assignment
      }
    }
  }

  return values;
}

// Find the unsolved square with the fewest possibilities
function find_min_square(values: GridValues): string | null {
  let minLen = 10;
  let minSquare: string | null = null;
  for (const s of squares) {
    const len = values[s].length;
    if (len > 1 && len < minLen) {
      minLen = len;
      minSquare = s;
      if (minLen === 2) break; // Optimization: Can't get better than 2
    }
  }
  return minSquare;
}

// Recursive search function
function search(values: GridValues | null): GridValues | null {
  if (!values) {
    return null; // Failed earlier
  }

  let solved = true;
  for (const s of squares) {
    if (values[s].length !== 1) {
      solved = false;
      break;
    }
  }
  if (solved) {
    return values; // Solution found
  }

  // Choose the unsolved square s with the fewest possibilities
  const s = find_min_square(values);
  if (!s) {
    return null; // Should not happen if puzzle is valid and not solved yet
  }

  // Try assigning each possible digit d to square s
  for (const d of values[s]) {
    const result = search(assign({ ...values }, s, d)); // Pass a copy
    if (result) {
      return result; // Found a solution
    }
  }

  return null; // This branch failed
}

// Main solver function (takes 2D array, returns solved GridValues or null)
function solve(board: number[][]): GridValues | null {
  const values = parse_grid(board);
  return search(values);
}

// Helper to convert solved GridValues back to number[][] (optional)
function gridValuesToBoard(values: GridValues): number[][] {
  const board: number[][] = Array(9)
    .fill(0)
    .map(() => Array(9).fill(0));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const s = rows[r] + cols[c];
      if (values[s]?.length === 1) {
        board[r][c] = parseInt(values[s], 10);
      } else {
        board[r][c] = 0; // Or handle error/unsolved state
      }
    }
  }
  return board;
}

// Function to check if a number placement is valid
export function isValid(
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) {
      return false;
    }
  }
  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) {
      return false;
    }
  }
  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) {
        return false;
      }
    }
  }
  return true;
}

// Helper to shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Backtracking solver function (mutates the board, used for generation)
export function solveSudoku(board: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        const numbersToTry = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let num of numbersToTry) {
          if (isValid(board, i, j, num)) {
            board[i][j] = num;
            if (solveSudoku(board)) {
              return true;
            } else {
              board[i][j] = 0;
            }
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Helper to compare two boards
export function compareBoards(
  board1: CellValue[][],
  board2: CellValue[][]
): boolean {
  if (!board1 || !board2) return false;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board1[i][j] !== board2[i][j]) {
        return false;
      }
    }
  }
  return true;
}

// Function to generate a new solved Sudoku board
export function generateBoard(): number[][] {
  const board = Array(9)
    .fill(0)
    .map(() => Array(9).fill(0));
  solveSudoku(board);
  return board;
}

// Function to count solutions up to a limit (for uniqueness check)
function countSolutions(
  board: number[][],
  limit: number = 2
): { count: number; solutions: GridValues[] } {
  let count = 0;
  const solutions: GridValues[] = [];

  function searchCounter(values: GridValues | null): boolean {
    // Returns true if limit is reached
    if (!values) {
      return false; // Failed earlier
    }

    let solved = true;
    for (const s of squares) {
      if (values[s].length !== 1) {
        solved = false;
        break;
      }
    }
    if (solved) {
      count++;
      // solutions.push(values); // Optionally store solutions if needed
      return count >= limit; // Stop if limit reached
    }

    const s = find_min_square(values);
    if (!s) {
      return false; // Contradiction or unexpected state
    }

    for (const d of values[s]) {
      if (searchCounter(assign({ ...values }, s, d))) {
        return true; // Limit reached in recursive call
      }
    }

    return false; // Limit not reached in this branch
  }

  const initialValues = parse_grid(board);
  if (initialValues) {
    searchCounter(initialValues);
  } else {
    count = 0; // Contradiction in initial parse means 0 solutions
  }

  return { count, solutions }; // Return count (and optionally solutions found)
}

// --- REVISED Function to create a puzzle ---
// Uses Norvig-style solver for uniqueness check
export function createPuzzle(
  solvedBoard: number[][],
  difficulty: number = 45, // Number of cells to REMOVE
  maxAttempts: number = 100 // May need more attempts for harder levels
): number[][] | null {
  console.log(`Attempting to create puzzle with difficulty ${difficulty}...`);

  // Convert the difficulty (cells to remove) to target cells remaining
  // Total cells = 81. Min reasonable remaining might be ~17-20.
  const targetRemaining = 81 - difficulty;
  if (targetRemaining < 17) {
    console.warn(
      `Difficulty ${difficulty} is very high, may result in few remaining cells (${targetRemaining}). Generation might fail or be slow.`
    );
    // Adjust targetRemaining if needed, e.g., Math.max(17, targetRemaining);
  }

  const puzzle = solvedBoard.map((row) => [...row]);
  const potentialRemovals = shuffleArray([...squares]); // Shuffle coordinates

  let removedCount = 0;
  for (const s of potentialRemovals) {
    const r = rows.indexOf(s[0]);
    const c = cols.indexOf(s[1]);

    if (puzzle[r][c] === 0) continue; // Already removed

    const originalValue = puzzle[r][c];
    puzzle[r][c] = 0; // Tentatively remove
    removedCount++;

    // Check uniqueness using the efficient counter
    const { count } = countSolutions(puzzle, 2); // Stop checking after finding 2 solutions

    if (count !== 1) {
      // If not exactly 1 solution, put the number back
      puzzle[r][c] = originalValue;
      removedCount--;
    }

    // Stop if we have removed enough cells (targetRemaining determines puzzle difficulty)
    // We check 81 - removedCount against targetRemaining
    if (81 - removedCount <= targetRemaining) {
      break; // Optional: Stop early if target met
    }

    // Safety break if somehow we remove too many (shouldn't happen with uniqueness check)
    if (removedCount >= difficulty) {
      break;
    }
  }

  // Final check: ensure the puzzle still has exactly one solution
  const finalCheck = countSolutions(puzzle, 2);
  if (finalCheck.count === 1) {
    console.log(
      `Puzzle created successfully with ${81 - removedCount} cells remaining.`
    );
    return puzzle;
  } else {
    // This might happen if the random removal order didn't allow reaching the target
    // while maintaining uniqueness, or if the loop finished trying all squares.
    // Can retry the whole process, return the best attempt, or fail.
    console.error(
      `Failed to create a unique puzzle with target difficulty ${difficulty}. Final puzzle has ${finalCheck.count} solutions. Retrying or adjust difficulty.`
    );
    // For simplicity here, return null. A retry loop could be added around this whole logic.
    return null; // Indicate failure
  }
}
