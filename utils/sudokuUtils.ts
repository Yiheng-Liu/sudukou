import { CellValue } from "../types/sudokuTypes"; // Assuming types are moved later

// --- Sudoku Generation & Validation Logic ---

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

// Deterministic backtracking solver (mutates board, used for checking puzzle)
export function solvePuzzle(board: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, i, j, num)) {
            board[i][j] = num;
            if (solvePuzzle(board)) {
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

// Function to create a puzzle by removing cells from a solved board
export function createPuzzle(
  solvedBoard: number[][],
  difficulty: number = 45,
  maxAttempts: number = 10
): number[][] | null {
  console.log("Attempting to create puzzle...");
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const puzzle = solvedBoard.map((row) => [...row]);
    let cellsToRemove = difficulty;
    let removedCoords = new Set<string>();
    while (cellsToRemove > 0 && removedCoords.size < 81) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      const coord = `${row}-${col}`;
      if (puzzle[row][col] !== 0 && !removedCoords.has(coord)) {
        puzzle[row][col] = 0;
        removedCoords.add(coord);
        cellsToRemove--;
      }
      if (removedCoords.size >= 81) break;
    }
    const puzzleToCheck = puzzle.map((row) => [...row]);
    if (solvePuzzle(puzzleToCheck)) {
      if (compareBoards(puzzleToCheck, solvedBoard)) {
        console.log(
          `Puzzle created successfully after ${attempt + 1} attempts.`
        );
        return puzzle;
      }
    }
    console.log(
      `Attempt ${
        attempt + 1
      } failed: puzzle was unsolvable or had different solution.`
    );
  }
  console.error("Failed to create a unique puzzle after multiple attempts.");
  return null;
}
