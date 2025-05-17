import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import {
  BoardState,
  SelectedCell,
  Conflicts,
  DraftMarks,
} from "../types/sudokuTypes"; // Adjust path if needed
import { rows, cols } from "../utils/sudokuUtils";
import SudokuCell from "../components/ui/SudokuCell";
import SudokuBlockOverlay from "../components/ui/SudokuBlockOverlay";

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
            <SudokuCell
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

  // Get board size from styles.board
  const boardStyle = StyleSheet.flatten(styles.board) || {};
  const boardWidth =
    typeof boardStyle.width === "number" ? boardStyle.width : 0;
  const boardHeight =
    typeof boardStyle.height === "number" ? boardStyle.height : 0;

  return (
    <View
      style={[
        styles.board,
        (isGameWon || isGameOver) && styles.boardDisabled,
        { position: "relative", borderWidth: 0 },
      ]}
    >
      {renderGridInRows()}
      {/* Overlay for 3x3 thick borders */}
      {boardWidth > 0 && boardHeight > 0 && (
        <SudokuBlockOverlay
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          borderColor={boardStyle.borderColor as string}
        />
      )}
    </View>
  );
};

export default SudokuGrid;
