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
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Import icons
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

    const thickBorderWidth = 2;
    const thickBorderColor =
      StyleSheet.flatten(styles.board)?.borderColor?.toString() || "#343A40";

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

    const cellStyle: StyleProp<ViewStyle>[] = [styles.cell];
    const textStyle: StyleProp<TextStyle>[] = [styles.cellText];

    if (isSelected) cellStyle.push(styles.selectedCell);
    if (isConflict && !cellValue) cellStyle.push(styles.conflictCell);
    if (isAutoFilling) cellStyle.push(styles.autoFillingHighlight);

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

    const ERROR_ICON_COLOR = "#DC3545"; // Use the defined error color

    return (
      <TouchableOpacity
        style={cellStyle}
        onPress={() => handleSelectCell(row, col)}
        disabled={isDisabled || isFixed}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            },
            isErroring && { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {displayContent}
          {isErroring && (
            <MaterialCommunityIcons
              name="close"
              size={
                Math.min(
                  StyleSheet.flatten(styles.cellText).fontSize || 24,
                  24
                ) * 1.2
              } // Adjust size based on cellText or a fixed value
              color={ERROR_ICON_COLOR}
              style={{
                position: "absolute", // Position on top
                // backgroundColor: 'rgba(255,255,255,0.3)' // Optional: slight background for visibility
              }}
            />
          )}
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

  // Overlay for 3x3 thick borders
  // Get board size from styles.board
  const boardStyle = StyleSheet.flatten(styles.board) || {};
  const boardWidth =
    typeof boardStyle.width === "number" ? boardStyle.width : 0;
  const boardHeight =
    typeof boardStyle.height === "number" ? boardStyle.height : 0;
  const thickBorderWidth = 2;
  const thickBorderColor = boardStyle.borderColor || "#343A40";
  const cellSize = boardWidth / 9;

  // Draw 4 vertical and 4 horizontal lines at 0, 3, 6, 9
  const lines = [];
  // Vertical lines
  for (let i = 0; i <= 9; i += 3) {
    lines.push(
      <View
        key={`vline-${i}`}
        style={{
          position: "absolute",
          left:
            i === 9
              ? boardWidth - thickBorderWidth
              : cellSize * i - (i === 0 ? 0 : thickBorderWidth / 2),
          top: 0,
          width: thickBorderWidth,
          height: boardHeight,
          backgroundColor: thickBorderColor,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
    );
  }
  // Horizontal lines
  for (let i = 0; i <= 9; i += 3) {
    lines.push(
      <View
        key={`hline-${i}`}
        style={{
          position: "absolute",
          top:
            i === 9
              ? boardHeight - thickBorderWidth
              : cellSize * i - (i === 0 ? 0 : thickBorderWidth / 2),
          left: 0,
          height: thickBorderWidth,
          width: boardWidth,
          backgroundColor: thickBorderColor,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
    );
  }

  return (
    <View
      style={[
        styles.board,
        (isGameWon || isGameOver) && styles.boardDisabled,
        { position: "relative", borderWidth: 0 }, // Remove board border
      ]}
    >
      {renderGridInRows()}
      {/* Overlay for 3x3 thick borders */}
      {boardWidth > 0 && boardHeight > 0 && lines}
    </View>
  );
};

export default SudokuGrid;
