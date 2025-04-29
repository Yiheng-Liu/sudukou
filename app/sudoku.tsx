import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
// Import an icon library if you have one, otherwise use text
// Example using expo-vector-icons (install if needed: npx expo install @expo/vector-icons)
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// Import the SVG icon
// import EraseIcon from "../assets/images/erase.svg";
// import ClearIcon from "../assets/images/clear.svg";
// import RefreshIcon from "../assets/images/refresh.svg";
import { useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams

// Import types
// import {
//   CellValue,
//   SelectedCell,
//   BoardState,
//   SolutionState,
//   Conflicts,
// } from "../types/sudokuTypes";
// Import custom hook and types
import { useSudokuGame } from "../hooks/useSudokuGame";

// Import the new components
import SudokuGrid from "../components/SudokuGrid";
import FunctionButtons from "../components/FunctionButtons";
import NumberPad from "../components/NumberPad";
import GameModals from "../components/GameModals";
import InfoArea from "../components/InfoArea";

const { width, height } = Dimensions.get("window"); // Get height too
// Make board size responsive and capped
const boardMaxWidth = 450;
const availableWidth = width * 0.95;
const availableHeight = height * 0.55;

// Calculate ideal cell size based on smallest dimension, then floor it
let idealBoardSize = Math.min(availableWidth, availableHeight, boardMaxWidth);
let calculatedCellSize = Math.floor(idealBoardSize / 9);

// Recalculate boardSize to be a precise multiple of the floored cell size
const boardSize = calculatedCellSize * 9;
const cellSize = calculatedCellSize; // Use the floored value

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PRIMARY_COLOR = "#4A90E2"; // Define primary color
const ERROR_COLOR = "#DC3545"; // Define error color

export default function SudokuScreen() {
  const params = useLocalSearchParams(); // Get route params
  // const difficultyParam = params.difficulty; // Removed unused variable

  // Get state and handlers from the custom hook
  const {
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
    errorCell,
    provideHint,
    toggleDraftMode,
  } = useSudokuGame();

  // Convert remainingCounts Map to an object for NumberPad prop
  const remainingCountsObject = useMemo(() => {
    const obj: { [key: number]: number } = {};
    remainingCounts.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [remainingCounts]);

  // Removed helper functions (clearError, clearAutoFillTimeout) as they used setters
  // Removed calculation functions (calculateRemainingCounts, calculateConflicts) as they are in the hook
  // Removed useEffect hooks (win condition check, remaining counts, auto-fill) as they are in the hook
  // Removed rendering functions (renderGrid, renderFunctionButtons, renderNumberPad)

  return (
    <View style={styles.screenContainer}>
      {/* Game Win/Over Modals */}
      <GameModals
        isGameWon={isGameWon}
        isGameOver={isGameOver}
        startNewGame={startNewGame}
        styles={{
          modalContainer: styles.modalContainer,
          modalContent: styles.modalView,
          modalText: styles.modalText,
          modalButton: styles.modalButton,
          modalButtonText: styles.modalButtonText,
          modalButtonOuterContainer: styles.modalButtonContainer,
        }}
      />

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {/* Info Area (Lives, Error, Status) */}
        <InfoArea
          livesRemaining={livesRemaining}
          errorMessage={errorMessage}
          isErasing={false}
          selectedCell={selectedCell}
          selectedNumber={selectedNumber}
          isGameWon={isGameWon}
          isGameOver={isGameOver}
          styles={{
            infoArea: styles.infoArea,
            infoText: styles.infoText,
            errorText: styles.errorText,
            livesText: styles.livesText,
          }}
        />

        {/* Sudoku Grid */}
        <SudokuGrid
          board={board}
          initialPuzzleState={initialPuzzleState}
          selectedCell={selectedCell}
          errorCell={errorCell}
          conflicts={conflicts}
          autoFillingCell={autoFillingCell}
          draftMarks={draftMarks}
          handleSelectCell={handleSelectCell}
          isGameWon={isGameWon}
          isGameOver={isGameOver}
          styles={{
            board: styles.board,
            boardDisabled: styles.boardDisabled,
            row: styles.row,
            cell: styles.cell,
            selectedCell: styles.selectedCell,
            conflictCell: styles.conflictCell,
            autoFillingHighlight: styles.autoFillingHighlight,
            cellText: styles.cellText,
            draftContainer: styles.draftContainer,
            draftText: styles.draftText,
            autoFillNumber: styles.autoFillNumber,
            fixedText: styles.fixedText,
            userNumberText: styles.userNumberText,
            loadingText: styles.loadingText,
          }}
        />

        {/* Function Buttons (Hint, Draft, New) */}
        <FunctionButtons
          startNewGame={startNewGame}
          hintsRemaining={hintsRemaining}
          handleProvideHint={provideHint}
          isDraftMode={isDraftMode}
          handleToggleDraftMode={toggleDraftMode}
          isGameWon={isGameWon}
          isGameOver={isGameOver}
          styles={{
            functionButtonContainer: styles.functionButtonContainer,
            functionButton: styles.functionButton,
            hintButton: styles.hintButton,
            draftButton: styles.draftButton,
            selectedDraftButton: styles.selectedDraftButton,
            newGameButton: styles.newGameButton,
            functionButtonText: styles.functionButtonText,
            iconStyle: styles.iconStyle,
            boardDisabled: styles.boardDisabled,
          }}
        />

        {/* Number Pad */}
        <NumberPad
          numbers={numbers}
          remainingCounts={remainingCountsObject}
          selectedNumber={selectedNumber}
          handleSelectNumber={handleSelectNumber}
          isGameWon={isGameWon}
          isGameOver={isGameOver}
          cellSize={cellSize}
          styles={{
            numberPadContainer: styles.numberPadContainer,
            numberCard: styles.numberCard,
            selectedNumberCard: styles.selectedNumberCard,
            disabledNumberCard: styles.disabledNumberCard,
            numberText: styles.numberText,
            countText: styles.countText,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    width: "100%",
    maxWidth: boardMaxWidth + 40,
    alignItems: "center",
    padding: 10,
  },
  infoArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: boardSize,
    maxWidth: "100%",
    minHeight: 35,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
  },
  livesText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    color: ERROR_COLOR,
    fontWeight: "bold",
    textAlign: "center",
    flexShrink: 1,
    marginHorizontal: 10,
  },
  board: {
    width: boardSize,
    height: boardSize,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#343A40",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  boardDisabled: {
    opacity: 0.6,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  selectedCell: {
    backgroundColor: "#D6EAF8",
  },
  conflictCell: {
    backgroundColor: "#FADBD8",
  },
  autoFillingHighlight: {
    backgroundColor: "#FEF9E7",
  },
  cellText: {
    fontSize: Math.min(cellSize * 0.5, 24),
    fontWeight: "bold",
  },
  fixedText: {
    color: "#343A40",
  },
  userNumberText: {
    color: PRIMARY_COLOR,
  },
  loadingText: {
    fontSize: 16,
    color: "#6C757D",
  },
  functionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: boardSize * 0.8,
    maxWidth: "90%",
    marginBottom: 20,
    marginTop: 10,
  },
  functionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CED4DA",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  functionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginTop: 4,
  },
  hintButton: {
    // Specific overrides if needed
  },
  draftButton: {
    // Specific overrides if needed
  },
  selectedDraftButton: {
    backgroundColor: "#D6EAF8",
    borderColor: PRIMARY_COLOR,
  },
  newGameButton: {
    // Specific overrides if needed
  },
  iconStyle: {
    color: PRIMARY_COLOR,
    fontSize: 20,
  },
  numberPadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: boardSize * 0.9,
  },
  numberCard: {
    width: (boardSize * 0.9 - 20) / 5 - 8,
    aspectRatio: 1,
    margin: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CED4DA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedNumberCard: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  disabledNumberCard: {
    backgroundColor: "#E9ECEF",
    opacity: 0.6,
  },
  numberText: {
    fontSize: Math.min(cellSize * 0.5, 20),
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  countText: {
    position: "absolute",
    bottom: 2,
    right: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#6C757D",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#343A40",
  },
  modalButtonContainer: {
    marginTop: 15,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
    backgroundColor: PRIMARY_COLOR,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  draftContainer: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "center",
    justifyContent: "center",
    padding: 1,
  },
  draftText: {
    fontSize: Math.min(cellSize * 0.2, 10),
    color: "#6C757D",
    textAlign: "center",
    width: "33%",
    height: "33%",
    lineHeight: Math.min(cellSize * 0.25, 12),
  },
  autoFillNumber: {
    color: "#28A745",
    fontWeight: "bold",
  },
});
