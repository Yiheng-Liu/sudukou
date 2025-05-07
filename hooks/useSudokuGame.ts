import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useUser } from "@/context/UserContext";
import { supabase, getDifficultyKey } from "@/lib/supabaseClient";

// Define DraftMarks type
type DraftMarks = { [cellKey: string]: Set<number> };

// Define SavedGameState type
type SavedGameState = {
  board: BoardState;
  initialPuzzleState: BoardState;
  solution: SolutionState;
  livesRemaining: number;
  hintsRemaining: number;
  draftMarks: DraftMarks;
  difficulty: number;
};

const SAVED_GAME_KEY = "sudokuGameState";

export function useSudokuGame() {
  const params = useLocalSearchParams();
  const difficultyParam = params.difficulty;
  const { userId, isOnline, fetchRecord: refreshUserRecord } = useUser();

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
  const [errorCell, setErrorCell] = useState<SelectedCell>(null);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [livesRemaining, setLivesRemaining] = useState<number>(2);
  const [hintsRemaining, setHintsRemaining] = useState<number>(3);
  const [currentDifficulty, setCurrentDifficulty] = useState<number>(50);
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

  // Extracted core game initialization logic
  const initializeNewGame = useCallback(
    (difficulty: number | string = 50) => {
      console.log(`Initializing new game with difficulty: ${difficulty}`);
      clearError();
      clearAutoFillTimeout();
      setAutoFillingCell(null);
      setIsGameWon(false);
      setIsGameOver(false);
      setLivesRemaining(2);
      setHintsRemaining(3);
      setCurrentDifficulty(difficulty as number);
      setBoard(null); // Clear board initially
      setInitialPuzzleState(null);
      setSolution(null);
      setSelectedCell(null);
      setSelectedNumber(null);
      setIsDraftMode(false);
      setDraftMarks({});
      setConflicts(new Set());

      let cellsToRemove = 50; // Default difficulty (Medium)
      if (typeof difficulty === "string") {
        const parsedNum = parseInt(difficulty, 10);
        if (!isNaN(parsedNum)) {
          cellsToRemove = parsedNum;
        } else {
          console.warn(
            `Invalid difficulty string "${difficulty}", using default: ${cellsToRemove}`
          );
        }
      } else if (typeof difficulty === "number") {
        cellsToRemove = difficulty;
      }

      // Use the difficulty stored in state now
      cellsToRemove = currentDifficulty;

      // --- Generate Board and Puzzle ---
      try {
        const solvedBoard = generateBoard();
        const puzzleBoard = createPuzzle(solvedBoard, cellsToRemove);

        if (puzzleBoard) {
          setSolution(solvedBoard);
          const initialPuzzle = puzzleBoard.map((row) => [...row]);
          const currentBoard = puzzleBoard.map((row) => [...row]);
          setInitialPuzzleState(initialPuzzle);
          setBoard(currentBoard);
          calculateRemainingCounts(currentBoard);
          console.log("New game initialized successfully");
        } else {
          console.error("Failed to generate a valid puzzle.");
          setErrorMessage("Error generating puzzle. Try again.");
          calculateRemainingCounts(null); // Calculate counts for empty board
        }
      } catch (error) {
        console.error("Error during board generation:", error);
        setErrorMessage("Critical error generating puzzle.");
        calculateRemainingCounts(null);
      }
    },
    [
      clearError,
      clearAutoFillTimeout,
      calculateRemainingCounts,
      currentDifficulty,
    ]
  );

  // Renamed from startNewGame, calls initializeNewGame (Modified)
  const startNewGame = useCallback(() => {
    console.log("startNewGame button pressed - initializing new game...");
    // Always uses the difficulty from params if available, otherwise defaults
    // Handle potential string array from params (Added check)
    const difficultyToUse = Array.isArray(difficultyParam)
      ? difficultyParam[0]
      : difficultyParam;
    initializeNewGame(difficultyToUse ?? 50);
  }, [difficultyParam, initializeNewGame]);

  // --- Effect for Initial Load --- (Added)
  useEffect(() => {
    const loadGame = async () => {
      if (difficultyParam) {
        // If difficulty is provided, start a new game
        console.log("Difficulty param found, starting new game.");
        // Handle potential string array from params (Added check)
        const difficultyToUse = Array.isArray(difficultyParam)
          ? difficultyParam[0]
          : difficultyParam;
        initializeNewGame(difficultyToUse);
      } else {
        // No difficulty param, try to load saved game
        console.log("No difficulty param, attempting to load saved game.");
        try {
          const savedStateString = await AsyncStorage.getItem(SAVED_GAME_KEY);
          if (savedStateString) {
            console.log("Found saved game state.");
            const savedState: SavedGameState = JSON.parse(savedStateString);

            // Need to deserialize the Set within draftMarks
            const deserializedDraftMarks: DraftMarks = {};
            for (const key in savedState.draftMarks) {
              if (
                Object.prototype.hasOwnProperty.call(savedState.draftMarks, key)
              ) {
                // Ensure draftMarks[key] is treated as an array before creating a Set
                const marksArray = savedState.draftMarks[
                  key
                ] as unknown as number[];
                deserializedDraftMarks[key] = new Set(marksArray || []);
              }
            }

            // Validate loaded state (basic checks)
            if (
              savedState.board &&
              savedState.initialPuzzleState &&
              savedState.solution
            ) {
              setBoard(savedState.board);
              setInitialPuzzleState(savedState.initialPuzzleState);
              setSolution(savedState.solution);
              setLivesRemaining(savedState.livesRemaining ?? 2);
              setHintsRemaining(savedState.hintsRemaining ?? 3);
              setCurrentDifficulty(savedState.difficulty ?? 50);
              setDraftMarks(deserializedDraftMarks); // Use deserialized marks
              calculateRemainingCounts(savedState.board);
              // Reset other volatile states
              setSelectedCell(null);
              setSelectedNumber(null);
              setIsDraftMode(false);
              setConflicts(new Set());
              setIsGameWon(false);
              setIsGameOver(false);
              setErrorMessage(null);
              setAutoFillingCell(null);
              console.log("Saved game loaded successfully.");
            } else {
              console.warn(
                "Loaded game state is invalid. Starting new default game."
              );
              await AsyncStorage.removeItem(SAVED_GAME_KEY); // Clear invalid state
              initializeNewGame(); // Start default medium game
            }
          } else {
            console.log("No saved game found. Starting new default game.");
            initializeNewGame(); // Start default medium game
          }
        } catch (error) {
          console.error("Failed to load game state:", error);
          setErrorMessage("Failed to load saved game. Starting new game.");
          initializeNewGame(); // Start default medium game on error
        }
      }
    };

    loadGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficultyParam]); // Removed initializeNewGame from deps as it causes re-runs
  // initializeNewGame is stable due to its own useCallback deps

  // --- Save Game State ---
  const saveGameState = useCallback(async () => {
    if (!board || !initialPuzzleState || !solution || isGameWon || isGameOver) {
      // Don't save if game isn't properly initialized or is finished
      // Optionally clear saved state if game is finished
      if (isGameWon || isGameOver) {
        console.log("Game finished, clearing saved state.");
        try {
          await AsyncStorage.removeItem(SAVED_GAME_KEY);
        } catch (error) {
          console.error("Failed to clear saved game state:", error);
        }
      }
      return;
    }

    // Serialize DraftMarks Set correctly
    const serializableDraftMarks: { [key: string]: number[] } = {};
    for (const key in draftMarks) {
      if (Object.prototype.hasOwnProperty.call(draftMarks, key)) {
        serializableDraftMarks[key] = Array.from(draftMarks[key]);
      }
    }

    const stateToSave: SavedGameState = {
      board,
      initialPuzzleState,
      solution,
      livesRemaining,
      hintsRemaining,
      draftMarks: serializableDraftMarks as unknown as DraftMarks, // Store serialized version
      difficulty: currentDifficulty,
    };

    try {
      const jsonState = JSON.stringify(stateToSave);
      await AsyncStorage.setItem(SAVED_GAME_KEY, jsonState);
      console.log("Game state saved.");
    } catch (error) {
      console.error("Failed to save game state:", error);
      // Optionally set an error message for the user
      setErrorMessage("Failed to save game progress.");
      errorTimeoutRef.current = setTimeout(() => {
        clearError();
      }, 3000);
    }
  }, [
    board,
    initialPuzzleState,
    solution,
    livesRemaining,
    hintsRemaining,
    draftMarks,
    isGameWon,
    isGameOver,
    currentDifficulty,
    clearError,
  ]); // Dependencies for saving

  const toggleDraftMode = useCallback(() => {
    setIsDraftMode((prev) => !prev);
    console.log(`Draft mode toggled: ${!isDraftMode}`);
  }, [isDraftMode]);

  const handleSelectNumber = useCallback(
    (num: number) => {
      clearError();
      const newSelectedNumber = num === selectedNumber ? null : num;
      setSelectedNumber(newSelectedNumber);
      setSelectedCell(null);
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
            // Placement Prevented due to Conflict
            console.log(
              `handleSelectCell: Cannot place ${selectedNumber} in conflicting cell ${cellKey}`
            );
            return; // Still return to forbid placement
          }

          // Add/remove draft mark (only if cell is empty and not conflicting)
          setDraftMarks((prevDrafts) => {
            console.log("handleSelectCell: Inside setDraftMarks updater");
            // Log previous state safely
            try {
              console.log(
                "   Prev Drafts:",
                JSON.stringify(
                  Object.fromEntries(
                    Object.entries(prevDrafts).map(([k, v]) => [
                      k,
                      Array.from(v),
                    ])
                  )
                )
              );
            } catch (e) {
              console.error("Error logging prevDrafts:", e);
            }

            const newDrafts = { ...prevDrafts };
            const currentMarks = newDrafts[cellKey] ?? new Set<number>();
            const draftAction = currentMarks.has(selectedNumber)
              ? "delete"
              : "add";

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

            console.log(`   Draft Action: ${draftAction} ${selectedNumber}`);
            // Log new state safely
            try {
              console.log(
                "   New Drafts:",
                JSON.stringify(
                  Object.fromEntries(
                    Object.entries(newDrafts).map(([k, v]) => [
                      k,
                      Array.from(v),
                    ])
                  )
                )
              );
            } catch (e) {
              console.error("Error logging newDrafts:", e);
            }

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
          // Placement Prevented due to Conflict
          console.log(
            `handleSelectCell: Cannot place ${selectedNumber} in conflicting cell ${cellKey}`
          );
          return; // Still return to forbid placement
        }

        // 4. Is the number incorrect? (Handles lives/game over)
        if (selectedNumber !== solution[row][col]) {
          console.log(
            `handleSelectCell: Incorrect number ${selectedNumber} placed.`
          );
          // *** Trigger Error Animation ***
          setErrorCell({ row, col });
          // Clear the error state after animation duration
          setTimeout(() => setErrorCell(null), 500); // Match animation time

          // *** Decrement Lives / Game Over ***
          const newLives = livesRemaining - 1;
          setLivesRemaining(newLives);
          if (newLives <= 0) {
            setIsGameOver(true);
            // Clear selections etc. on game over
            setSelectedCell(null);
            setSelectedNumber(null);
            setIsDraftMode(false);
            setConflicts(new Set());
            setErrorCell(null); // Ensure error state is clear on game over
          }
          return; // Don't proceed to place the number
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

  // --- Update Record Logic --- (Defined outside useEffect)
  const updateRecordOnWin = useCallback(async () => {
    // Use userId, isOnline, currentDifficulty from hook's scope
    if (!userId || !isOnline) {
      console.warn(
        "Game won, but cannot update record (offline or no user ID).",
        { userId, isOnline }
      );
      return;
    }

    const difficultyKey = getDifficultyKey(currentDifficulty);
    if (!difficultyKey) {
      console.error(
        "Game won, but invalid difficulty found:",
        currentDifficulty
      );
      return;
    }

    console.log(`Attempting to increment ${difficultyKey} for user ${userId}`);

    try {
      const { error: rpcError } = await supabase.rpc("increment_difficulty", {
        user_uuid: userId,
        difficulty_column: difficultyKey,
      });

      if (rpcError) {
        console.error(
          `Error updating record via RPC for ${difficultyKey}:`,
          rpcError
        );
        // Handle error: Maybe set a state variable to show an error message?
      } else {
        console.log(
          `Successfully incremented ${difficultyKey} for user ${userId}`
        );
        // Trigger a refresh of user data in UserContext
        // Adding refreshUserRecord to dependencies ensures it's stable
        refreshUserRecord();
      }
    } catch (err) {
      console.error("Error updating game record on win:", err);
    }
  }, [userId, isOnline, currentDifficulty, refreshUserRecord]); // Added dependencies

  // --- Effects ---

  // Effect to save game state whenever mutable state changes (Debounced?)
  // Using useEffect for saving might be better than calling it in multiple handlers
  useEffect(() => {
    // Debounce save operation? For now, save directly.
    saveGameState();
  }, [board, livesRemaining, hintsRemaining, draftMarks, saveGameState]); // Save when these change

  // Win Check & Update Record
  useEffect(() => {
    if (!board || !solution || isGameWon || isGameOver) return;

    let isComplete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j] || board[i][j] !== solution[i][j]) {
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

      // Call the update function
      updateRecordOnWin();
    }
  }, [board, solution, isGameWon, isGameOver, updateRecordOnWin]); // Added updateRecordOnWin to dependencies

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
    errorCell,
    currentDifficulty,
  };
}
