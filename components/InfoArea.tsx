import React from "react";
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface InfoAreaProps {
  livesRemaining: number;
  errorMessage: string | null;
  selectedCell: { row: number; col: number } | null;
  currentDifficulty: number;
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
  selectedCell,
  currentDifficulty,
  isGameWon,
  isGameOver,
  styles,
}) => {
  // Helper function to map difficulty number to name
  const getDifficultyName = (difficultyValue: number): string => {
    if (difficultyValue <= 40) return "Easy"; // Example threshold
    if (difficultyValue <= 50) return "Medium"; // Example threshold
    if (difficultyValue <= 60) return "Hard"; // Example threshold
    return "Extreme";
  };

  const difficultyName = getDifficultyName(currentDifficulty);

  if (isGameWon || isGameOver) return null; // Don't show info area when game is won or over

  return (
    <View style={styles.infoArea}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <AntDesign
          name="heart"
          size={14}
          color={StyleSheet.flatten(styles.livesText)?.color || "#4A90E2"}
        />
        <Text style={[styles.infoText, styles.livesText, { marginLeft: 4 }]}>
          Lives: {livesRemaining}
        </Text>
      </View>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      <Text style={styles.infoText}>
        Selected:{" "}
        {selectedCell
          ? `R${selectedCell.row + 1}C${selectedCell.col + 1}`
          : "None"}
      </Text>
      <Text style={styles.infoText}>Difficulty: {difficultyName}</Text>
    </View>
  );
};

export default InfoArea;
