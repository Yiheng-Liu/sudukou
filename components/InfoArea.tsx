import React from "react";
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native";

interface InfoAreaProps {
  livesRemaining: number;
  errorMessage: string | null;
  isErasing: boolean;
  selectedCell: { row: number; col: number } | null;
  selectedNumber: number | null;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: {
    infoArea: StyleProp<ViewStyle>;
    infoText: StyleProp<TextStyle>;
    errorText: StyleProp<TextStyle>;
    livesText: StyleProp<TextStyle>;
  };
}

const InfoArea: React.FC<InfoAreaProps> = ({
  livesRemaining,
  errorMessage,
  isErasing,
  selectedCell,
  selectedNumber,
  isGameWon,
  isGameOver,
  styles,
}) => {
  let statusText = "Selecting";
  if (isErasing) {
    statusText = "Erasing";
  } else if (selectedNumber) {
    statusText = `Entering ${selectedNumber}`;
  }

  if (isGameWon || isGameOver) return null; // Don't show info area when game is won or over

  return (
    <View style={styles.infoArea}>
      <Text style={[styles.infoText, styles.livesText]}>
        Lives: {livesRemaining}
      </Text>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      <Text style={styles.infoText}>
        Selected:{" "}
        {selectedCell
          ? `R${selectedCell.row + 1}C${selectedCell.col + 1}`
          : "None"}
      </Text>
      <Text style={styles.infoText}>Mode: {statusText}</Text>
    </View>
  );
};

export default InfoArea;
