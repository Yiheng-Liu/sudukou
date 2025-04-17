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
  eraserButton: StyleProp<ViewStyle>;
  clearButton: StyleProp<ViewStyle>;
  hintButton: StyleProp<ViewStyle>;
  newGameButton: StyleProp<ViewStyle>;
  selectedEraserButton: StyleProp<ViewStyle>;
  eraserButtonText: StyleProp<TextStyle>;
  selectedEraserText: StyleProp<TextStyle>;
  clearButtonText: StyleProp<TextStyle>;
  hintButtonText: StyleProp<TextStyle>;
  newGameButtonText: StyleProp<TextStyle>;
  boardDisabled: StyleProp<ViewStyle>;
}

// Define the props required by the FunctionButtons component
interface Props {
  isErasing: boolean;
  handleSelectEraser: () => void;
  handleClearBoard: () => void;
  startNewGame: () => void;
  hintsRemaining: number;
  handleProvideHint: () => void;
  isGameWon: boolean;
  isGameOver: boolean;
  styles: Styles;
}

const FunctionButtons: React.FC<Props> = ({
  isErasing,
  handleSelectEraser,
  handleClearBoard,
  startNewGame,
  hintsRemaining,
  handleProvideHint,
  isGameWon,
  isGameOver,
  styles,
}) => {
  const isDisabled = isGameWon || isGameOver;
  const isHintDisabled = isDisabled || hintsRemaining <= 0;

  return (
    <View style={styles.functionButtonContainer}>
      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.eraserButton,
          isErasing && styles.selectedEraserButton,
          isDisabled && styles.boardDisabled,
        ]}
        onPress={handleSelectEraser}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.eraserButtonText,
            isErasing && styles.selectedEraserText,
          ]}
        >
          {isErasing ? "Eraser On" : "Erase"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.functionButton,
          styles.clearButton,
          isDisabled && styles.boardDisabled,
        ]}
        onPress={handleClearBoard}
        disabled={isDisabled}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
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
