import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  BoardState,
  SelectedCell,
  Conflicts,
  CellValue,
  DraftMarks,
} from "../types/sudokuTypes"; // Adjust path if needed
import { rows, cols } from "../utils/sudokuUtils";

// Style types for SudokuGrid
interface SudokuGridStyles {
  board: StyleProp<ViewStyle>;
  boardDisabled: StyleProp<ViewStyle>;
  row: StyleProp<ViewStyle>;
  cell: StyleProp<ViewStyle>;
  selectedCell: StyleProp<ViewStyle>;
  conflictCell: StyleProp<ViewStyle>;
  autoFillingHighlight: StyleProp<ViewStyle>;
  rightThickBorder: StyleProp<ViewStyle>;
  bottomThickBorder: StyleProp<ViewStyle>;
  cellText: StyleProp<TextStyle>;
  draftContainer: StyleProp<ViewStyle>;
  draftText: StyleProp<TextStyle>;
  autoFillNumber: StyleProp<TextStyle>;
  fixedText: StyleProp<TextStyle>;
  userNumberText: StyleProp<TextStyle>;
  loadingText: StyleProp<TextStyle>;
}

// Prop types for SudokuGrid
// Define the shape for the auto-filling cell state
type AutoFillingCell = { r: number; c: number; num: number } | null;

interface SudokuGridProps {
  board: BoardState | null;
  initialPuzzleState: BoardState | null;
  selectedCell: SelectedCell | null;
  conflicts: Conflicts;
  autoFillingCell: AutoFillingCell;
  draftMarks: DraftMarks;
  handleSelectCell: (row: number, col: number) => void;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: SudokuGridStyles;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  initialPuzzleState,
  selectedCell,
  conflicts,
  autoFillingCell,
  draftMarks,
  handleSelectCell,
  isGameWon,
  isGameOver,
  styles,
}) => {
  // Function to render a single cell
  const renderCell = (cellValue: CellValue, row: number, col: number) => {
    const cellKey = rows[row] + cols[col];
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isConflict = conflicts.has(cellKey);
    const isFixed = initialPuzzleState?.[row]?.[col] !== 0;
    const isAutoFilling =
      autoFillingCell?.r === row && autoFillingCell?.c === col;
    const currentDraftMarks = draftMarks[cellKey];

    const cellStyle: StyleProp<ViewStyle>[] = [styles.cell];
    const textStyle: StyleProp<TextStyle>[] = [styles.cellText];

    // Apply cell background styles
    if (col === 2 || col === 5) cellStyle.push(styles.rightThickBorder);
    if (row === 2 || row === 5) cellStyle.push(styles.bottomThickBorder);
    if (isSelected && !isGameWon && !isGameOver)
      cellStyle.push(styles.selectedCell);
    // Show conflict background if the selected number conflicts and the cell is empty
    if (isConflict && !isGameWon && !cellValue) {
      cellStyle.push(styles.conflictCell);
    }
    if (isAutoFilling) cellStyle.push(styles.autoFillingHighlight);

    let displayContent: React.ReactNode = null;

    if (cellValue && cellValue !== 0) {
      // --- Display Main Number ---
      if (isFixed) {
        textStyle.push(styles.fixedText);
      } else {
        textStyle.push(styles.userNumberText);
      }
      if (isAutoFilling) {
        textStyle.push(styles.autoFillNumber);
      }
      displayContent = <Text style={textStyle}>{cellValue}</Text>;
    } else if (currentDraftMarks && currentDraftMarks.size > 0) {
      // --- Display Draft Marks ---
      // Sort marks for consistent display order
      const sortedMarks = Array.from(currentDraftMarks).sort((a, b) => a - b);
      displayContent = (
        <View style={styles.draftContainer}>
          {sortedMarks.map((mark) => (
            <Text key={mark} style={styles.draftText}>
              {mark}
            </Text>
          ))}
        </View>
      );
    }
    // Else: Cell is empty and has no draft marks, displayContent remains null

    return (
      <TouchableOpacity
        key={cellKey}
        style={cellStyle}
        onPress={() => handleSelectCell(row, col)}
        disabled={isGameWon || isGameOver || isFixed || board === null}
        activeOpacity={0.7}
      >
        {displayContent}
      </TouchableOpacity>
    );
  };

  // Function to render the grid
  const renderGridInternal = () => {
    if (!board) {
      return <Text style={styles.loadingText}>Loading puzzle...</Text>; // Or some loading indicator
    }

    return board.map((rowValues, rowIndex) => (
      <View key={rowIndex} style={styles.row}>
        {rowValues.map((cellValue, colIndex) =>
          renderCell(cellValue, rowIndex, colIndex)
        )}
      </View>
    ));
  };

  return (
    <View
      style={[styles.board, (isGameWon || isGameOver) && styles.boardDisabled]}
    >
      {renderGridInternal()}
    </View>
  );
};

export default SudokuGrid;
