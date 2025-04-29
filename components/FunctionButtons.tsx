import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
// Consider importing an icon library like @expo/vector-icons if you add icons

// Define the styles required by the FunctionButtons component
interface Styles {
  functionButtonContainer: StyleProp<ViewStyle>;
  functionButton: StyleProp<ViewStyle>;
  // Specific button type styles (can be merged with base functionButton)
  hintButton?: StyleProp<ViewStyle>;
  draftButton?: StyleProp<ViewStyle>;
  selectedDraftButton?: StyleProp<ViewStyle>; // Keep for draft mode indication
  newGameButton?: StyleProp<ViewStyle>;
  // Generic text style
  functionButtonText: StyleProp<TextStyle>;
  // Style for potential icons
  iconStyle?: StyleProp<TextStyle>;
  // Style for disabled state (can be applied conditionally)
  boardDisabled?: StyleProp<ViewStyle>;
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
    <View style={styles.functionButtonContainer}>
      {/* Draft Button */}
      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.draftButton, // Apply specific style if provided
          isDraftMode && styles.selectedDraftButton,
          isDisabled && styles.boardDisabled, // Apply disabled style
        ]}
        onPress={handleToggleDraftMode}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {/* Add Icon Placeholder here if desired, using styles.iconStyle */}
        {/* <Icon name="pencil" style={styles.iconStyle} /> */}
        <Text style={[styles.functionButtonText]}>Draft</Text>
      </TouchableOpacity>

      {/* Hint Button */}
      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.hintButton, // Apply specific style if provided
          isHintDisabled && styles.boardDisabled, // Apply disabled style
        ]}
        onPress={handleProvideHint}
        disabled={isHintDisabled}
        activeOpacity={0.7}
      >
        {/* Add Icon Placeholder here if desired, using styles.iconStyle */}
        {/* <Icon name="lightbulb-on-outline" style={styles.iconStyle} /> */}
        <Text style={styles.functionButtonText}>Hint ({hintsRemaining})</Text>
      </TouchableOpacity>

      {/* New Game Button */}
      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.newGameButton, // Apply specific style if provided
          // Note: New Game is never disabled in current logic
        ]}
        onPress={startNewGame}
        activeOpacity={0.7}
      >
        {/* Add Icon Placeholder here if desired, using styles.iconStyle */}
        {/* <Icon name="refresh" style={styles.iconStyle} /> */}
        <Text style={styles.functionButtonText}>New Game</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FunctionButtons;
