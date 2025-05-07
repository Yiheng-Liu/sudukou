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
  currentDifficulty: number;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: {
    infoArea: StyleProp<ViewStyle>;
    infoText: StyleProp<TextStyle>;
    livesText: StyleProp<TextStyle>;
  };
}

const InfoArea: React.FC<InfoAreaProps> = ({
  livesRemaining,
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
  const livesColor = StyleSheet.flatten(styles.livesText)?.color || "#4A90E2";

  if (isGameWon || isGameOver) return null;

  return (
    <View style={[styles.infoArea, { justifyContent: "space-between" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <AntDesign name="heart" size={14} color={livesColor} />
        <Text style={[styles.infoText, styles.livesText, { marginLeft: 4 }]}>
          Lives: {livesRemaining}
        </Text>
      </View>

      <Text style={styles.infoText}>Difficulty: {difficultyName}</Text>
    </View>
  );
};

export default InfoArea;
