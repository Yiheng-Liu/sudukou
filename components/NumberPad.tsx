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
  numberStackCardContainer: StyleProp<ViewStyle>;
  stackCard: StyleProp<ViewStyle>;
  numberTextContainer: StyleProp<ViewStyle>;
  numberStackText: StyleProp<TextStyle>;
  selectedNumberStackText: StyleProp<TextStyle>;
  countText: StyleProp<TextStyle>;
  numberPadPlaceholder: StyleProp<ViewStyle>;
  // Inherited style (needed because it uses cellSize)
  container?: StyleProp<ViewStyle>; // Assuming it might be passed or used
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
  // Get the base dimensions from the numberCard style if available, otherwise fallback to cellSize
  // Note: This assumes numberCard has a defined width/height or uses cellSize as a fallback
  const flatStyles = StyleSheet.flatten(styles.numberCard);
  const baseWidth = (flatStyles?.width as number) ?? cellSize;
  const baseHeight = (flatStyles?.height as number) ?? cellSize;

  const renderNumberCard = (num: number | null, index: number) => {
    if (num === null) {
      return (
        <View
          key={`placeholder-${index}`}
          style={styles.numberPadPlaceholder}
        />
      );
    }

    const isSelected = selectedNumber === num;
    const count = remainingCounts[num] || 0;
    const isDisabled = count === 0 || isGameWon || isGameOver;

    const cardStyles = [
      styles.numberCard,
      isSelected && styles.selectedNumberCard,
      isDisabled && { opacity: 0.5 },
    ];

    // Stack effect visual configuration
    const stackDepth = Math.min(count, 3); // Max 3 cards visually
    const offsetIncrement = 3;

    return (
      <TouchableOpacity
        key={num}
        style={cardStyles}
        onPress={() => handleSelectNumber(num)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {/* Container for stacking cards */}
        <View style={styles.numberStackCardContainer}>
          {/* Background stacked cards */}
          {Array.from({ length: stackDepth - 1 }, (_, i) => (
            <View
              key={`stack-${i}`}
              style={[
                styles.stackCard,
                {
                  width: baseWidth - offsetIncrement * (stackDepth - 1 - i) * 2,
                  height:
                    baseHeight - offsetIncrement * (stackDepth - 1 - i) * 2,
                  bottom: offsetIncrement * (stackDepth - 1 - i),
                  right: offsetIncrement * (stackDepth - 1 - i),
                  backgroundColor: isSelected ? "#d4eaff" : "#f0f0f0", // Slightly different background for stack
                  borderColor: isSelected ? "#b8daff" : "#e0e0e0",
                },
              ]}
            />
          ))}
          {/* Top card / Text container */}
          <View
            style={[
              styles.numberTextContainer,
              {
                width: baseWidth - offsetIncrement * (stackDepth - 1) * 2,
                height: baseHeight - offsetIncrement * (stackDepth - 1) * 2,
                bottom: offsetIncrement * (stackDepth - 1), // Offset based on stack depth
                right: offsetIncrement * (stackDepth - 1), // Offset based on stack depth
              },
            ]}
          >
            <Text
              style={[
                styles.numberStackText,
                isSelected && styles.selectedNumberStackText,
              ]}
            >
              {num}
            </Text>
          </View>
        </View>

        {/* Count Text */}
        {count > 0 && <Text style={styles.countText}>{count}</Text>}
      </TouchableOpacity>
    );
  };

  // Calculate required placeholders to center the last row
  const itemsInLastRow = numbers.length % 3;
  const placeholdersNeeded = itemsInLastRow === 0 ? 0 : 3 - itemsInLastRow;
  const placeholderArray = Array(placeholdersNeeded).fill(null);

  return (
    <View style={styles.numberPadContainer}>
      {[...numbers, ...placeholderArray].map(renderNumberCard)}
    </View>
  );
};

export default NumberPad;
