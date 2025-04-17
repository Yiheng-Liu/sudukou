import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

interface GameModalsProps {
  isGameWon: boolean;
  isGameOver: boolean;
  startNewGame: () => void;
  styles: {
    modalContainer: StyleProp<ViewStyle>;
    modalContent: StyleProp<ViewStyle>;
    modalText: StyleProp<TextStyle>;
    modalButton: StyleProp<ViewStyle>;
    modalButtonText: StyleProp<TextStyle>;
    modalButtonOuterContainer?: StyleProp<ViewStyle>;
  };
}

const GameModals: React.FC<GameModalsProps> = ({
  isGameWon,
  isGameOver,
  startNewGame,
  styles,
}) => {
  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGameWon}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Congratulations! You won!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={startNewGame}>
              <Text style={styles.modalButtonText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isGameOver}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Game Over! No lives remaining.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={startNewGame}>
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default GameModals;
