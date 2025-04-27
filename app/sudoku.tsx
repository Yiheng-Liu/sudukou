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
const boardMaxWidth = 500; // Max width for the board in pixels
const boardSize = Math.min(width * 0.9, height * 0.6, boardMaxWidth);
const cellSize = boardSize / 9;
const innerBorderWidth = 1;
const outerBorderWidth = 2;
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    <View style={styles.outerContainer}>
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
          modalButtonText: styles.newGameButtonText,
          modalButtonOuterContainer: styles.modalButtonContainer,
        }}
      />

      {/* Centered Content Area */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sudoku</Text>

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
            infoArea: styles.infoContainer, // Renamed from infoContainer
            infoText: styles.infoText, // New style needed
            errorText: styles.errorText,
          }}
        />

        {/* Sudoku Grid */}
        <SudokuGrid
          board={board}
          initialPuzzleState={initialPuzzleState}
          selectedCell={selectedCell}
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
            rightThickBorder: styles.rightThickBorder,
            bottomThickBorder: styles.bottomThickBorder,
            cellText: styles.cellText,
            draftContainer: styles.draftContainer,
            draftText: styles.draftText,
            autoFillNumber: styles.autoFillNumber,
            fixedText: styles.fixedText,
            userNumberText: styles.userNumberText,
            loadingText: styles.loadingText,
          }}
        />

        {/* Function Buttons (Erase, Clear, New) */}
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
            hintButtonText: styles.hintButtonText,
            draftButtonText: styles.draftButtonText,
            newGameButtonText: styles.newGameButtonText,
            boardDisabled: styles.boardDisabled,
          }}
        />

        {/* Number Pad */}
        <NumberPad
          numbers={numbers} // Pass numbers array
          remainingCounts={remainingCountsObject} // Pass the converted object
          selectedNumber={selectedNumber}
          handleSelectNumber={handleSelectNumber}
          isGameWon={isGameWon}
          isGameOver={isGameOver}
          cellSize={cellSize} // Pass cellSize for dynamic sizing
          styles={{
            numberPadContainer: styles.numberPadContainer,
            numberCard: styles.numberCard,
            selectedNumberCard: styles.selectedNumberCard,
            numberTextContainer: styles.numberTextContainer, // Added
            numberStackText: styles.numberStackText, // Added
            selectedNumberStackText: styles.selectedNumberStackText, // Added
            numberStackCardContainer: styles.numberStackCardContainer, // Added
            stackCard: styles.stackCard, // Added
            countText: styles.countText,
            numberPadPlaceholder: styles.numberPadPlaceholder,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: "#f0f0f0", // Light background for the whole screen
  },
  contentContainer: {
    width: "100%",
    maxWidth: boardMaxWidth + 20,
    alignItems: "center",
    padding: 10, // Add padding inside content
    backgroundColor: "#ffffff", // White background for the game area
    borderRadius: 10, // Rounded corners for the content area
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15, // Reduced margin
    color: "#333",
  },
  // --- Info Area Styles (Moved from infoContainer) ---
  infoContainer: {
    flexDirection: "row", // Align items horizontally
    justifyContent: "space-between", // Space out items
    alignItems: "center",
    width: boardSize, // Match board width
    maxWidth: "100%",
    minHeight: 30, // Reduced height
    marginBottom: 10, // Space below info
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 14, // Adjusted size
    color: "#555",
    flexShrink: 1, // Allow text to shrink if needed
    textAlign: "center", // Center text within its space
    marginHorizontal: 5, // Add horizontal margin
  },
  livesText: {
    fontSize: 14,
    color: "#17a2b8",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "center",
    marginHorizontal: 5,
  },
  // --- SudokuGrid Styles ---
  board: {
    width: boardSize,
    height: boardSize,
    borderWidth: outerBorderWidth,
    borderColor: "#333",
    flexDirection: "column",
    marginBottom: 15,
    backgroundColor: "#fff", // Ensure board bg is white
  },
  boardDisabled: {
    opacity: 0.6,
  },
  row: {
    flexDirection: "row",
    flex: 1,
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderWidth: innerBorderWidth,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  selectedCell: {
    backgroundColor: "#cce5ff",
  },
  conflictCell: {
    backgroundColor: "#f8d7da",
  },
  autoFillingHighlight: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeeba",
    borderWidth: 2,
  },
  rightThickBorder: {
    borderRightWidth: outerBorderWidth,
    borderRightColor: "#333",
  },
  bottomThickBorder: {
    borderBottomWidth: outerBorderWidth,
    borderBottomColor: "#333",
  },
  cellText: {
    fontSize: cellSize * 0.5,
  },
  autoFillNumber: {
    fontSize: cellSize * 0.5,
    fontWeight: "bold",
    color: "#856404",
  },
  fixedText: {
    color: "#333",
    fontWeight: "bold",
  },
  userNumberText: {
    color: "#007bff",
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
    color: "#6c757d",
  },
  // --- FunctionButtons Styles ---
  functionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: boardSize,
    maxWidth: "100%",
    marginVertical: 15,
  },
  functionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  hintButton: {
    backgroundColor: "#6c757d",
    borderColor: "#5a6268",
  },
  hintButtonText: {
    fontSize: cellSize * 0.35,
    fontWeight: "bold",
    color: "#fff",
  },
  newGameButton: {
    backgroundColor: "#17a2b8",
    borderColor: "#117a8b",
  },
  newGameButtonText: {
    fontSize: cellSize * 0.35,
    fontWeight: "bold",
    color: "#fff",
  },
  draftButton: {
    // Style for the draft button
    backgroundColor: "#f8f9fa", // Similar to old eraser
    borderColor: "#ced4da",
    // Inherits padding/borderWidth etc from functionButton
  },
  selectedDraftButton: {
    // Style when draft mode is active
    backgroundColor: "#a2d2ff", // Lighter, distinct blue
    borderColor: "#74b9ff", // Slightly darker blue border
    borderWidth: 1.5, // Make border slightly thicker when active
    elevation: 4, // Increase elevation slightly
  },
  draftButtonText: {
    // Text style for draft button
    fontSize: cellSize * 0.35,
    fontWeight: "bold",
    color: "#075985", // Use a color that works on light/blue bg
  },
  // --- NumberPad Styles ---
  numberPadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    width: boardSize,
    maxWidth: "100%",
  },
  numberCard: {
    width: cellSize * 1.15,
    height: cellSize * 1.15,
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedNumberCard: {
    backgroundColor: "#d1e7ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  // Styles for the stack effect (needed by NumberPad)
  numberStackCardContainer: {
    position: "absolute", // Needed to stack
    width: "100%", // Take up parent (TouchableOpacity) space
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  stackCard: {
    position: "absolute",
    borderRadius: 6,
    // borderWidth: 1, // Remove border
    // Use semi-transparent background based on selection state
    // Background color/border color set dynamically, but we remove fixed border here
  },
  numberTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#fff", // Remove background
    borderRadius: 6,
    // borderWidth: 1, // Remove border
    // borderColor: "#adb5bd", // Remove border
    // elevation: 1, // Remove elevation, rely on main card's
    // Width, height, bottom, right set dynamically in NumberPad
  },
  numberStackText: {
    fontSize: cellSize * 0.6,
    fontWeight: "bold",
    color: "#495057",
  },
  selectedNumberStackText: {
    color: "#0056b3", // Darker blue for selected number
  },
  countText: {
    position: "absolute",
    top: 4,
    right: 6,
    fontSize: cellSize * 0.25,
    fontWeight: "bold",
    color: "#6c757d",
    zIndex: 10, // Ensure count is above text container
  },
  numberPadPlaceholder: {
    width: cellSize * 1.15,
    height: cellSize * 1.15,
    margin: 5,
  },
  // --- GameModals Styles ---
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalButtonContainer: {
    marginTop: 10,
    width: "60%",
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#17a2b8",
    borderColor: "#117a8b",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  draftContainer: {
    // Style for the container holding draft numbers
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    padding: 1, // Small padding
  },
  draftText: {
    // Style for the small draft numbers
    fontSize: cellSize * 0.18, // Much smaller font size
    lineHeight: cellSize * 0.25, // Adjust line height
    color: "#6c757d", // Dimmer color
    textAlign: "center",
    width: "33%", // Roughly fit 3 numbers per line
  },
});
