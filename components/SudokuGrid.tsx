import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Animated,
} from "react-native";
import {
  BoardState,
  SelectedCell,
  Conflicts,
  CellValue,
  DraftMarks,
} from "../types/sudokuTypes"; // Adjust path if needed
import { rows, cols } from "../utils/sudokuUtils";

// Style types passed down to SudokuGrid
interface SudokuGridStyles {
  board: StyleProp<ViewStyle>;
  boardDisabled: StyleProp<ViewStyle>;
  row: StyleProp<ViewStyle>;
  cell: StyleProp<ViewStyle>;
  selectedCell: StyleProp<ViewStyle>;
  conflictCell: StyleProp<ViewStyle>;
  autoFillingHighlight: StyleProp<ViewStyle>;
  errorCellBorder?: StyleProp<ViewStyle>;
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
  errorCell: SelectedCell | null;
  conflicts: Conflicts;
  autoFillingCell: AutoFillingCell;
  draftMarks: DraftMarks;
  handleSelectCell: (row: number, col: number) => void;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: SudokuGridStyles;
}

// --- Cell Component (Handles its own borders) ---
interface CellProps {
  cellValue: CellValue;
  row: number;
  col: number;
  isSelected: boolean;
  isConflict: boolean;
  isFixed: boolean;
  isAutoFilling: boolean;
  isErroring: boolean;
  currentDraftMarks: Set<number> | undefined;
  handleSelectCell: (row: number, col: number) => void;
  styles: SudokuGridStyles;
  isDisabled: boolean;
}

const Cell: React.FC<CellProps> = React.memo(
  ({
    cellValue,
    row,
    col,
    isSelected,
    isConflict,
    isFixed,
    isAutoFilling,
    isErroring,
    currentDraftMarks,
    handleSelectCell,
    styles,
    isDisabled,
  }) => {
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const isMounted = useRef(true);

    // Define border style properties locally
    const thickBorderWidth = 2;
    const thickBorderColor =
      StyleSheet.flatten(styles.board)?.borderColor?.toString() || "#343A40";
    const errorBorderColor =
      StyleSheet.flatten(styles.errorCellBorder)?.borderColor?.toString() ||
      "#DC3545";

    // Trigger shake animation and handle error border timeout
    useEffect(() => {
      isMounted.current = true;
      let timeoutId: NodeJS.Timeout | null = null;

      if (isErroring) {
        shakeAnimation.setValue(0);
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 8,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -8,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 8,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
        // Timeout cleared when isErroring becomes false (handled by parent)
      }
      // Cleanup function
      return () => {
        isMounted.current = false;
        shakeAnimation.stopAnimation(); // Stop animation on unmount
      };
    }, [isErroring, shakeAnimation]);

    // Determine Cell Styles
    const cellStyle: StyleProp<ViewStyle>[] = [
      styles.cell, // Base style now includes thin borders
    ];
    const textStyle: StyleProp<TextStyle>[] = [styles.cellText];

    // Backgrounds
    if (isSelected) cellStyle.push(styles.selectedCell);
    if (isConflict && !cellValue) cellStyle.push(styles.conflictCell);
    if (isAutoFilling) cellStyle.push(styles.autoFillingHighlight);

    // --- Border Overrides (Apply Thick Block Borders) ---
    if (col === 2 || col === 5) {
      cellStyle.push({
        borderRightWidth: thickBorderWidth,
        borderRightColor: thickBorderColor,
      });
    }
    if (row === 2 || row === 5) {
      cellStyle.push({
        borderBottomWidth: thickBorderWidth,
        borderBottomColor: thickBorderColor,
      });
    }

    // Error Border (Apply only when erroring)
    if (isErroring) {
      cellStyle.push({
        borderWidth: thickBorderWidth,
        borderColor: errorBorderColor,
      });
    }

    // --- Determine Cell Content ---
    let displayContent: React.ReactNode = null;
    if (cellValue && cellValue !== 0) {
      if (isFixed) textStyle.push(styles.fixedText);
      else textStyle.push(styles.userNumberText);
      if (isAutoFilling) textStyle.push(styles.autoFillNumber);
      displayContent = <Text style={textStyle}>{cellValue}</Text>;
    } else if (currentDraftMarks && currentDraftMarks.size > 0) {
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

    return (
      <TouchableOpacity
        style={cellStyle}
        onPress={() => handleSelectCell(row, col)}
        disabled={isDisabled || isFixed}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          {displayContent}
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

// --- SudokuGrid Component (Renders Rows) ---
const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  initialPuzzleState,
  selectedCell,
  errorCell,
  conflicts,
  autoFillingCell,
  draftMarks,
  handleSelectCell,
  isGameWon,
  isGameOver,
  styles,
}) => {
  // Function to render the grid using rows
  const renderGridInRows = () => {
    if (!board) {
      return <Text style={styles.loadingText}>Loading puzzle...</Text>;
    }
    const gridDisabled = isGameWon || isGameOver;
    return board.map((rowValues, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.row}>
        {rowValues.map((cellValue, colIndex) => {
          const cellKey = rows[rowIndex] + cols[colIndex];
          return (
            <Cell
              key={cellKey}
              cellValue={cellValue}
              row={rowIndex}
              col={colIndex}
              isSelected={
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              }
              isConflict={conflicts.has(cellKey)}
              isFixed={initialPuzzleState?.[rowIndex]?.[colIndex] !== 0}
              isAutoFilling={
                autoFillingCell?.r === rowIndex &&
                autoFillingCell?.c === colIndex
              }
              isErroring={
                errorCell?.row === rowIndex && errorCell?.col === colIndex
              }
              currentDraftMarks={draftMarks[cellKey]}
              handleSelectCell={handleSelectCell}
              styles={styles}
              isDisabled={gridDisabled}
            />
          );
        })}
      </View>
    ));
  };

  return (
    <View
      style={[styles.board, (isGameWon || isGameOver) && styles.boardDisabled]}
    >
      {renderGridInRows()}
    </View>
  );
};

export default SudokuGrid;
