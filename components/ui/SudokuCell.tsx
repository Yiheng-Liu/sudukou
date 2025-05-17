import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CellValue, DraftMarks } from "../../types/sudokuTypes";

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

interface SudokuCellProps {
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

const SudokuCell: React.FC<SudokuCellProps> = React.memo(
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

    useEffect(() => {
      isMounted.current = true;
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
      }
      return () => {
        isMounted.current = false;
        shakeAnimation.stopAnimation();
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

    const ERROR_ICON_COLOR = "#DC3545";

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
                  // @ts-ignore
                  (styles.cellText?.fontSize as number) || 24,
                  24
                ) * 1.2
              }
              color={ERROR_ICON_COLOR}
              style={{ position: "absolute" }}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

export default SudokuCell;
