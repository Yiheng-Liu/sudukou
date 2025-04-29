import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

type NumberPadStyles = {
  numberPadContainer: StyleProp<ViewStyle>;
  numberCard: StyleProp<ViewStyle>;
  selectedNumberCard: StyleProp<ViewStyle>;
  disabledNumberCard: StyleProp<ViewStyle>;
  numberText: StyleProp<TextStyle>;
  countText: StyleProp<TextStyle>;
};

type Props = {
  numbers: number[];
  remainingCounts: { [key: number]: number };
  selectedNumber: number | null;
  handleSelectNumber: (num: number) => void;
  isGameWon: boolean;
  isGameOver: boolean;
  cellSize: number; // Pass cellSize for dynamic styling
  styles: NumberPadStyles;
};

const NumberPad: React.FC<Props> = ({
  numbers,
  remainingCounts,
  selectedNumber,
  handleSelectNumber,
  isGameWon,
  isGameOver,
  cellSize, // Receive cellSize
  styles,
}) => {
  const renderNumberCard = (num: number) => {
    const isSelected = selectedNumber === num;
    const count = remainingCounts[num] || 0;
    const isDisabled = count === 0 || isGameWon || isGameOver;

    const cardStyles = [
      styles.numberCard,
      isSelected && styles.selectedNumberCard,
      isDisabled && styles.disabledNumberCard,
    ];

    const textStyles = [
      styles.numberText,
      isSelected && { color: "#FFFFFF" },
      isDisabled && { opacity: 0.5 },
    ];

    return (
      <TouchableOpacity
        key={num}
        style={cardStyles}
        onPress={() => handleSelectNumber(num)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Text style={textStyles}>{num}</Text>

        {count > 0 && <Text style={styles.countText}>{count}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.numberPadContainer}>
      {numbers.map(renderNumberCard)}
    </View>
  );
};

export default NumberPad;
