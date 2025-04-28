import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  isValid,
  generateBoard,
  createPuzzle,
  peers,
  rows,
  cols,
} from "../utils/sudokuUtils";
import {
  CellValue,
  SelectedCell,
  BoardState,
  SolutionState,
  Conflicts,
} from "../types/sudokuTypes";

// Define DraftMarks type
type DraftMarks = { [cellKey: string]: Set<number> };

export function useSudokuGame() {
  const params = useLocalSearchParams();
  const difficultyParam = params.difficulty;

  // --- State ---
  const [board, setBoard] = useState<BoardState>(null);
  const [initialPuzzleState, setInitialPuzzleState] =
    useState<BoardState>(null);
  const [solution, setSolution] = useState<SolutionState>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(false);
  const [draftMarks, setDraftMarks] = useState<DraftMarks>({});
  const [conflicts, setConflicts] = useState<Conflicts>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [livesRemaining, setLivesRemaining] = useState<number>(3);
  const [hintsRemaining, setHintsRemaining] = useState<number>(3);
  const [remainingCounts, setRemainingCounts] = useState<Map<number, number>>(
    new Map()
  );
  const [autoFillingCell, setAutoFillingCell] = useState<{
    r: number;
    c: number;
    num: number;
  } | null>(null);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoFillTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helper Functions ---
  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setErrorMessage(null);
  }, [errorTimeoutRef]);

  const clearAutoFillTimeout = useCallback(() => {
    if (autoFillTimeoutRef.current) {
      clearTimeout(autoFillTimeoutRef.current);
      autoFillTimeoutRef.current = null;
    }
  }, [autoFillTimeoutRef]);

  const calculateRemainingCounts = useCallback((currentBoard: BoardState) => {
    const counts = new Map<number, number>();
    for (let i = 1; i <= 9; i++) counts.set(i, 9);
    if (currentBoard) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cellValue = currentBoard[r][c];
          if (cellValue)
            counts.set(cellValue, (counts.get(cellValue) ?? 0) - 1);
        }
      }
    }
    counts.forEach((count, num) => {
      if (count < 0) counts.set(num, 0);
    });
    setRemainingCounts(counts);
  }, []);

  const calculateConflicts = useCallback(
    (num: number | null, currentBoard: BoardState) => {
      if (num === null || !currentBoard) {
        setConflicts(new Set());
        return;
      }
      const newConflicts = new Set<string>();
      const validationBoard = currentBoard.map((row) =>
        row.map((cell) => cell ?? 0)
      );
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (
            currentBoard[r][c] === 0 &&
            !isValid(validationBoard, r, c, num)
          ) {
            const cellKey = rows[r] + cols[c];
            newConflicts.add(cellKey);
          }
        }
      }
      setConflicts(newConflicts);
    },
    []
  );

  // --- Game Logic Handlers ---
  const startNewGame = useCallback(() => {
    console.log("Starting new game generation...");
    clearError();
    clearAutoFillTimeout();
    setAutoFillingCell(null);
    setIsGameWon(false);
    setIsGameOver(false);
    setLivesRemaining(3);
    setHintsRemaining(3);
    setBoard(null);
    setInitialPuzzleState(null);
    setSolution(null);
    setSelectedCell(null);
    setSelectedNumber(null);
    setIsDraftMode(false);
    setDraftMarks({});
    setConflicts(new Set());

    let cellsToRemove = 50; // Default difficulty (Medium)

    try {
      const parsedNum = parseInt(<string>difficultyParam, 10);
      cellsToRemove = parsedNum;
    } catch (error) {
      console.warn(
        `>>> Parsed difficultyParam "${difficultyParam}" is invalid, error: ${error}, using default: ${cellsToRemove}`
      );
    }

    // --- Generate Board and Puzzle ---
    const solvedBoard = generateBoard();
    const puzzleBoard = createPuzzle(solvedBoard, cellsToRemove);

    if (puzzleBoard) {
      setSolution(solvedBoard);
      setInitialPuzzleState(puzzleBoard.map((row) => [...row]));
      setBoard(puzzleBoard.map((row) => [...row]));
      calculateRemainingCounts(puzzleBoard);
      console.log("New game started successfully");
    } else {
      console.error("Failed to generate a valid puzzle.");
      setErrorMessage("Error generating puzzle. Try again.");
      calculateRemainingCounts(null);
    }
  }, [
    difficultyParam,
    clearError,
    clearAutoFillTimeout,
    calculateRemainingCounts,
  ]);

  const toggleDraftMode = useCallback(() => {
    setIsDraftMode((prev) => !prev);
    console.log(`Draft mode toggled: ${!isDraftMode}`);
  }, [isDraftMode]);

  const handleSelectNumber = useCallback(
    (num: number) => {
      clearError();
      const newSelectedNumber = num === selectedNumber ? null : num;
      setSelectedNumber(newSelectedNumber);
      calculateConflicts(newSelectedNumber, board);
      console.log(
        `Selected number: ${
          newSelectedNumber === null ? "none" : newSelectedNumber
        }`
      );
    },
    [selectedNumber, board, clearError, calculateConflicts]
  );

  const handleSelectCell = useCallback(
    (row: number, col: number) => {
      console.log(`--- handleSelectCell called for R${row + 1}C${col + 1} ---`);

      if (!initialPuzzleState || !board || isGameWon || isGameOver) {
        console.log("handleSelectCell: Returning early (invalid state)");
        return;
      }

      const cellKey = rows[row] + cols[col];
      const currentCellValue = board?.[row]?.[col]; // Get current value early
      clearError();

      // 1. Is it a fixed initial cell?
      if (initialPuzzleState?.[row]?.[col] !== 0) {
        console.log("handleSelectCell: Tapped on fixed cell");
        setSelectedCell(null); // Deselect if selecting a fixed cell
        return; // Cannot modify fixed cells
      }

      // 2. Is it already correctly filled by the user (and not in draft mode)?
      // Note: This check is now slightly redundant due to checks within modes, but harmless
      if (currentCellValue && currentCellValue !== 0 && !isDraftMode) {
        console.log(
          `handleSelectCell: Cell ${cellKey} already has final value ${currentCellValue}.`
        );
        setSelectedCell({ row, col }); // Allow selecting it, but not modifying
        return;
      }

      console.log(
        `handleSelectCell: Mode - Draft=${isDraftMode}, SelectedNum=${selectedNumber}`
      );

      // --- Action Based on Mode ---

      if (isDraftMode) {
        console.log("handleSelectCell: Entering Draft Mode logic");

        // 2a. Cannot place draft on cell with a final number
        if (currentCellValue && currentCellValue !== 0) {
          console.log(
            `handleSelectCell: Cannot place draft on cell ${cellKey} with final value ${currentCellValue}.`
          );
          // Optionally select the cell instead of doing nothing?
          // setSelectedCell({ row, col });
          return;
        }

        if (selectedNumber !== null) {
          // 2b. Cannot place draft if the number conflicts
          if (conflicts.has(cellKey)) {
            console.log(
              `handleSelectCell: Cannot place draft ${selectedNumber} in conflicting cell ${cellKey}`
            );
            setErrorMessage(
              `Cannot place draft ${selectedNumber} here (conflict).`
            );
            errorTimeoutRef.current = setTimeout(() => {
              clearError();
            }, 2000);
            return; // Forbid draft placement in conflicting cell
          }

          // Add/remove draft mark (only if cell is empty and not conflicting)
          setDraftMarks((prevDrafts) => {
            const newDrafts = { ...prevDrafts };
            const currentMarks = newDrafts[cellKey] ?? new Set<number>();
            if (currentMarks.has(selectedNumber)) {
              currentMarks.delete(selectedNumber);
            } else {
              currentMarks.add(selectedNumber);
            }
            if (currentMarks.size === 0) {
              delete newDrafts[cellKey];
            } else {
              newDrafts[cellKey] = new Set(currentMarks);
            }
            console.log(
              `   DraftMode: Updated draft marks for ${cellKey}:`,
              newDrafts[cellKey] ? Array.from(newDrafts[cellKey]) : "deleted"
            );
            return newDrafts;
          });
          // REMOVED the logic that cleared the board cell if it had a value
          setSelectedCell(null); // Deselect cell after modifying draft
        } else {
          // Selecting cell in draft mode (no number chosen yet) - allow selecting empty cells
          if (!currentCellValue) {
            setSelectedCell({ row, col });
          }
        }
      } else if (selectedNumber !== null) {
        console.log("handleSelectCell: Entering Normal Number Entry logic");
        // --- Normal Number Entry Logic ---
        if (!solution) {
          console.log("handleSelectCell: Returning early (no solution board)");
          return;
        }

        // 3. Is this cell conflicting with the selected number?
        if (conflicts.has(cellKey)) {
          console.log(
            `handleSelectCell: Cannot place ${selectedNumber} in conflicting cell ${cellKey}`
          );
          setErrorMessage(`Cannot place ${selectedNumber} here (conflict).`);
          errorTimeoutRef.current = setTimeout(() => {
            clearError();
          }, 2000);
          return; // Forbid placement in conflicting cell
        }

        // 4. Is the number incorrect? (Handles lives/game over)
        if (selectedNumber !== solution[row][col]) {
          console.log(
            `handleSelectCell: Incorrect number ${selectedNumber} placed.`
          );
          setErrorMessage(`Incorrect number.`);
          errorTimeoutRef.current = setTimeout(() => {
            clearError();
          }, 1500);
          const newLives = livesRemaining - 1;
          setLivesRemaining(newLives);
          if (newLives <= 0) {
            setIsGameOver(true);
            setSelectedCell(null);
            setSelectedNumber(null);
            setIsDraftMode(false);
            setConflicts(new Set());
          }
          return;
        }

        // --- Number is Correct and Placed ---
        console.log(
          `handleSelectCell: Correct number ${selectedNumber} placed. Updating board.`
        );
        const newBoard = board.map((r, rIdx) =>
          r.map((cVal, cIdx) =>
            rIdx === row && cIdx === col ? selectedNumber : cVal
          )
        );
        setBoard(newBoard);

        console.log("handleSelectCell: *** Starting Draft Mark Cleanup ***");

        const currentSquareKey = rows[row] + cols[col];
        const peerKeys = peers[currentSquareKey];
        console.log(
          `   Cleanup: Placed ${selectedNumber} at ${currentSquareKey}. Checking peers:`,
          Array.from(peerKeys)
        );

        setDraftMarks((prevDrafts) => {
          console.log(
            "   Cleanup: Previous Drafts:",
            JSON.stringify(
              Object.fromEntries(
                Array.from(Object.entries(prevDrafts), ([k, v]) => [
                  k,
                  Array.from(v),
                ])
              )
            )
          );
          const newDrafts = { ...prevDrafts };
          let changed = false;

          if (newDrafts[currentSquareKey]) {
            console.log(
              `      - Removing drafts from filled cell ${currentSquareKey}`
            );
            delete newDrafts[currentSquareKey];
            changed = true;
          }

          for (const peerKey of peerKeys) {
            if (newDrafts[peerKey]?.has(selectedNumber)) {
              console.log(
                `      - Found draft ${selectedNumber} in peer ${peerKey}. Removing.`
              );
              const newPeerMarks = new Set(newDrafts[peerKey]);
              newPeerMarks.delete(selectedNumber);
              changed = true;
              if (newPeerMarks.size === 0) {
                console.log(
                  `         - Peer ${peerKey} draft set now empty. Deleting key.`
                );
                delete newDrafts[peerKey];
              } else {
                newDrafts[peerKey] = newPeerMarks;
              }
            }
          }
          if (!changed) console.log("      - No draft mark changes needed.");
          console.log(
            "   Cleanup: New Drafts:",
            JSON.stringify(
              Object.fromEntries(
                Array.from(Object.entries(newDrafts), ([k, v]) => [
                  k,
                  Array.from(v),
                ])
              )
            )
          );
          return changed ? newDrafts : prevDrafts;
        });
        calculateConflicts(selectedNumber, newBoard);
      } else {
        console.log(
          "handleSelectCell: Entering Cell Selection logic (no number selected)"
        );
        // --- Just Selecting a Cell ---
        // Allow selecting only if the cell doesn't have a final number
        if (!currentCellValue) {
          setSelectedCell((prev) =>
            prev?.row === row && prev?.col === col ? null : { row, col }
          );
        } else {
          setSelectedCell(null); // Deselect if tapping a filled cell
        }
      }
    },
    [
      initialPuzzleState,
      board,
      solution,
      isGameWon,
      isGameOver,
      isDraftMode,
      selectedNumber,
      conflicts,
      livesRemaining,
      draftMarks,
      clearError,
      calculateConflicts,
      calculateRemainingCounts,
    ]
  );

  // --- Corrected provideHint ---
  const provideHint = useCallback(() => {
    // Check if hints are available and game is active
    if (hintsRemaining <= 0 || isGameWon || isGameOver || !board || !solution) {
      console.log(
        "Hint not available (no hints left, game over, or board/solution missing)."
      );
      return;
    }

    // Find all empty cells
    const emptyCells: { row: number; col: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // Consider both 0 and null as empty based on potential types
        if (board[r][c] === 0 || board[r][c] === null) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    if (emptyCells.length === 0) {
      console.log("No empty cells remaining.");
      // Optionally show a message to the user
      setErrorMessage("No empty cells left!");
      errorTimeoutRef.current = setTimeout(() => {
        clearError();
      }, 2000);
      return;
    }

    // Select a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    const correctValue = solution[row][col];

    if (correctValue) {
      console.log(
        `Providing hint: Placing ${correctValue} at R${row + 1}C${col + 1}`
      );
      // Create the new board with the hint applied
      const newBoard = board.map((r, rIdx) =>
        r.map((cVal, cIdx) =>
          rIdx === row && cIdx === col ? correctValue : cVal
        )
      );
      setBoard(newBoard); // Update the board state
      setHintsRemaining((prev) => prev - 1); // Decrement hint count

      // Recalculate counts and conflicts after board update
      calculateRemainingCounts(newBoard);
      calculateConflicts(selectedNumber, newBoard); // Recalculate conflicts for the currently selected number

      // Clear selection and error messages after hint
      setSelectedCell(null);
      clearError();

      // Note: Win condition check usually happens in useEffect based on board changes
    } else {
      console.error(
        `Could not find solution value for hint cell R${row + 1}C${col + 1}.`
      );
      // Optionally inform the user
      setErrorMessage("Hint error.");
      errorTimeoutRef.current = setTimeout(() => {
        clearError();
      }, 1500);
    }
  }, [
    hintsRemaining,
    isGameWon,
    isGameOver,
    board,
    solution,
    selectedNumber, // Added dependency
    calculateRemainingCounts,
    calculateConflicts, // Added dependency
    clearError, // Added dependency
    setErrorMessage, // Added dependency
    // Removed setHintsRemaining, setBoard, setSelectedCell from deps
  ]);

  // --- Effects ---

  // Initial game start
  useEffect(() => {
    startNewGame();
    // Cleanup timeout on unmount
    return () => {
      clearError();
      clearAutoFillTimeout();
    };
  }, [startNewGame]); // Rerun only if startNewGame changes (due to difficultyParam)

  // Win Check
  useEffect(() => {
    if (!board || !solution || isGameWon || isGameOver) return;
    let isComplete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j]) {
          isComplete = false;
          break;
        }
        if (board[i][j] !== solution[i][j]) {
          isComplete = false;
          break;
        }
      }
      if (!isComplete) break;
    }
    if (isComplete) {
      console.log("Game Won!");
      setIsGameWon(true);
      setSelectedCell(null);
      setSelectedNumber(null);
      setIsDraftMode(false);
      setConflicts(new Set());
    }
  }, [board, solution, isGameWon, isGameOver]);

  // Update Remaining Counts
  useEffect(() => {
    calculateRemainingCounts(board);
  }, [board, calculateRemainingCounts]);

  // Auto-fill: Last in unit
  useEffect(() => {
    if (!board || isGameWon || isGameOver || autoFillingCell) return;
    let boardUpdated = false;

    // Helper to find the only missing number in a unit (row, col, or block)
    const findMissingInUnit = (
      unit: CellValue[]
    ): { num: number | null; index: number } => {
      let emptyCount = 0;
      let emptyIndex = -1;
      const presentNumbers = new Set<number>();
      for (let i = 0; i < 9; i++) {
        const cell = unit[i];
        if (!cell) {
          // Checks for 0 or null
          emptyCount++;
          emptyIndex = i;
        } else {
          presentNumbers.add(cell);
        }
      }
      if (emptyCount === 1) {
        for (let num = 1; num <= 9; num++) {
          if (!presentNumbers.has(num)) {
            return { num: num, index: emptyIndex };
          }
        }
      }
      return { num: null, index: -1 };
    };

    // Helper to trigger the auto-fill animation/update
    const triggerAutoFill = (r: number, c: number, num: number) => {
      console.log(`Highlighting auto-fill for cell (${r}, ${c}) with ${num}`);
      clearAutoFillTimeout(); // Ensure previous timeouts are cleared
      setAutoFillingCell({ r, c, num });
      autoFillTimeoutRef.current = setTimeout(() => {
        setBoard((currentBoard) => {
          if (!currentBoard) return null;
          const newBoard = currentBoard.map((row) => [...row]);
          // Double check cell is still empty before filling
          if (newBoard[r][c] === 0 || newBoard[r][c] === null) {
            newBoard[r][c] = num;
          }
          return newBoard;
        });
        setAutoFillingCell(null);
        autoFillTimeoutRef.current = null;
      }, 500); // Adjust delay as needed
      boardUpdated = true;
    };

    // --- Check Units ---

    // 1. Check Rows
    for (let r = 0; r < 9 && !boardUpdated; r++) {
      const rowUnit = board[r];
      const { num, index: c } = findMissingInUnit(rowUnit);
      if (num !== null && c !== -1) {
        triggerAutoFill(r, c, num);
      }
    }

    // 2. Check Columns
    if (!boardUpdated) {
      for (let c = 0; c < 9 && !boardUpdated; c++) {
        const colUnit: CellValue[] = [];
        for (let r = 0; r < 9; r++) {
          colUnit.push(board[r][c]);
        }
        const { num, index: r } = findMissingInUnit(colUnit);
        if (num !== null && r !== -1) {
          triggerAutoFill(r, c, num);
        }
      }
    }

    // 3. Check 3x3 Blocks
    if (!boardUpdated) {
      for (let blockRow = 0; blockRow < 3 && !boardUpdated; blockRow++) {
        for (let blockCol = 0; blockCol < 3 && !boardUpdated; blockCol++) {
          const blockUnit: CellValue[] = [];
          const startRow = blockRow * 3;
          const startCol = blockCol * 3;
          let indices: { r: number; c: number }[] = []; // Store original indices
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              const r = startRow + i;
              const c = startCol + j;
              blockUnit.push(board[r][c]);
              indices.push({ r, c });
            }
          }
          const { num, index } = findMissingInUnit(blockUnit);
          if (num !== null && index !== -1) {
            const { r, c } = indices[index]; // Get original coordinates
            triggerAutoFill(r, c, num);
          }
        }
      }
    }
  }, [board, isGameWon, isGameOver, autoFillingCell, clearAutoFillTimeout]);

  // Auto-fill: Last remaining spot for number
  useEffect(() => {
    if (
      !board ||
      isGameWon ||
      isGameOver ||
      autoFillingCell ||
      !remainingCounts
    )
      return;
    const validationBoard = board.map((row) => row.map((cell) => cell ?? 0));
    for (let num = 1; num <= 9; num++) {
      const count = remainingCounts.get(num) ?? 0;
      if (count === 1) {
        let possibleTarget: { r: number; c: number } | null = null;
        let validSpotCount = 0;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (!board[r][c]) {
              if (isValid(validationBoard, r, c, num)) {
                validSpotCount++;
                if (validSpotCount === 1) possibleTarget = { r, c };
                else break;
              }
            }
          }
          if (validSpotCount > 1) break;
        }
        if (validSpotCount === 1 && possibleTarget) {
          console.log(`Highlighting auto-fill for last spot of ${num}`);
          clearAutoFillTimeout();
          const target = possibleTarget; // Capture for timeout closure
          setAutoFillingCell({ r: target.r, c: target.c, num });
          autoFillTimeoutRef.current = setTimeout(() => {
            setBoard((currentBoard) => {
              if (!currentBoard) return null;
              const newBoard = currentBoard.map((row) => [...row]);
              if (!newBoard[target.r][target.c])
                newBoard[target.r][target.c] = num;
              return newBoard;
            });
            setAutoFillingCell(null);
            autoFillTimeoutRef.current = null;
          }, 500);
          return;
        }
      }
    }
  }, [
    board,
    remainingCounts,
    isGameWon,
    isGameOver,
    autoFillingCell,
    clearAutoFillTimeout,
  ]); // Added clearAutoFillTimeout dependency

  // --- Return Values ---
  return {
    board,
    initialPuzzleState,
    selectedCell,
    selectedNumber,
    conflicts,
    errorMessage,
    isGameWon,
    isGameOver,
    livesRemaining,
    remainingCounts,
    autoFillingCell,
    hintsRemaining,
    isDraftMode,
    draftMarks,
    startNewGame,
    handleSelectNumber,
    handleSelectCell,
    provideHint,
    toggleDraftMode,
  };
}
