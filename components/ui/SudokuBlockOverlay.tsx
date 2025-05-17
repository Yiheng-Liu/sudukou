import React from "react";
import { View } from "react-native";

interface SudokuBlockOverlayProps {
  boardWidth: number;
  boardHeight: number;
  borderColor: string;
}

const SudokuBlockOverlay: React.FC<SudokuBlockOverlayProps> = ({
  boardWidth,
  boardHeight,
  borderColor,
}) => {
  const thickBorderWidth = 2;
  const cellSize = boardWidth / 9;
  const lines = [];
  // Vertical lines
  for (let i = 0; i <= 9; i += 3) {
    lines.push(
      <View
        key={`vline-${i}`}
        style={{
          position: "absolute",
          left:
            i === 9
              ? boardWidth - thickBorderWidth
              : cellSize * i - (i === 0 ? 0 : thickBorderWidth / 2),
          top: 0,
          width: thickBorderWidth,
          height: boardHeight,
          backgroundColor: borderColor,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
    );
  }
  // Horizontal lines
  for (let i = 0; i <= 9; i += 3) {
    lines.push(
      <View
        key={`hline-${i}`}
        style={{
          position: "absolute",
          top:
            i === 9
              ? boardHeight - thickBorderWidth
              : cellSize * i - (i === 0 ? 0 : thickBorderWidth / 2),
          left: 0,
          height: thickBorderWidth,
          width: boardWidth,
          backgroundColor: borderColor,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
    );
  }
  return <>{lines}</>;
};

export default SudokuBlockOverlay;
