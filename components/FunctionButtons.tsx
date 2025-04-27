import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

// Define the styles required by the FunctionButtons component
interface Styles {
  functionButtonContainer: StyleProp<ViewStyle>;
  functionButton: StyleProp<ViewStyle>;
  hintButton: StyleProp<ViewStyle>;
  draftButton: StyleProp<ViewStyle>;
  selectedDraftButton: StyleProp<ViewStyle>;
  newGameButton: StyleProp<ViewStyle>;
  hintButtonText: StyleProp<TextStyle>;
  draftButtonText: StyleProp<TextStyle>;
  newGameButtonText: StyleProp<TextStyle>;
  boardDisabled: StyleProp<ViewStyle>;
}

// Define the props required by the FunctionButtons component
interface Props {
  startNewGame: () => void;
  hintsRemaining: number;
  handleProvideHint: () => void;
  isDraftMode: boolean;
  handleToggleDraftMode: () => void;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: Styles;
}

const FunctionButtons: React.FC<Props> = ({
  startNewGame,
  hintsRemaining,
  handleProvideHint,
  isDraftMode,
  handleToggleDraftMode,
  isGameWon,
  isGameOver,
  styles,
}) => {
  const isDisabled = isGameWon || isGameOver;
  const isHintDisabled = isDisabled || hintsRemaining <= 0;

  return (
    <View
      style={[
        styles.functionButtonContainer,
        { justifyContent: "space-evenly" },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.draftButton,
          isDraftMode && styles.selectedDraftButton,
          isDisabled && styles.boardDisabled,
        ]}
        onPress={handleToggleDraftMode}
        disabled={isDisabled}
      >
        <Text
          style={[styles.draftButtonText, isDraftMode && { color: "#fff" }]}
        >
          Draft
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.hintButton,
          isHintDisabled && styles.boardDisabled,
        ]}
        onPress={handleProvideHint}
        disabled={isHintDisabled}
      >
        <Text style={styles.hintButtonText}>Hint ({hintsRemaining})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.functionButton, styles.newGameButton]}
        onPress={startNewGame}
      >
        <Text style={styles.newGameButtonText}>New Game</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FunctionButtons;
