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
} from "../types/sudokuTypes"; // Adjust path if needed

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
  autoFillingCell: AutoFillingCell; // Use the new type
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
  handleSelectCell,
  isGameWon,
  isGameOver,
  styles,
}) => {
  // Function to render a single cell
  const renderCell = (cellValue: CellValue, row: number, col: number) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isConflict = conflicts.has(`${row}-${col}`);
    const isFixed = initialPuzzleState?.[row]?.[col] !== 0;
    const isAutoFilling =
      autoFillingCell?.r === row && autoFillingCell?.c === col;

    const cellStyle: StyleProp<ViewStyle>[] = [styles.cell];
    const textStyle: StyleProp<TextStyle>[] = [styles.cellText];

    if (col === 2 || col === 5) cellStyle.push(styles.rightThickBorder);
    if (row === 2 || row === 5) cellStyle.push(styles.bottomThickBorder);
    if (isSelected && !isGameWon && !isGameOver)
      cellStyle.push(styles.selectedCell);
    if (isConflict && !isGameWon) cellStyle.push(styles.conflictCell);
    if (isAutoFilling) cellStyle.push(styles.autoFillingHighlight);

    if (isFixed) {
      textStyle.push(styles.fixedText);
    } else if (cellValue !== 0) {
      textStyle.push(styles.userNumberText);
    }
    if (isAutoFilling) {
      textStyle.push(styles.autoFillNumber);
    }

    const displayValue = cellValue === 0 ? "" : cellValue;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={cellStyle}
        onPress={() => handleSelectCell(row, col)}
        disabled={isGameWon || isGameOver || isFixed || board === null} // Disable fixed cells too
        activeOpacity={0.7} // Visual feedback on press
      >
        <Text style={textStyle}>{displayValue}</Text>
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
