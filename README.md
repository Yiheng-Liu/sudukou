# Sudoku Mobile App

A classic Sudoku game built using React Native and Expo.

## Features

- **Classic Sudoku Gameplay:** Fill a 9x9 grid following standard Sudoku rules.
- **Variable Difficulty:** Start new games with different levels of difficulty (controlled by the number of initially filled cells).
- **Error Highlighting:** Incorrect number placements are immediately highlighted (optional, depends on game rules applied).
- **Conflict Indication:** Shows potential conflicts for the selected number in empty cells.
- **Number Pad:** Easy input using a dedicated number pad showing remaining counts for each number.
- **Hint System:** Provides hints by filling a random empty cell with the correct answer (limited uses per game).
- **Erase Mode:** Easily clear user-entered numbers.
- **Clear Board:** Reset the board back to the initial puzzle state.
- **Responsive Design:** Adapts the board size to different screen dimensions.
- **Game State Management:** Tracks lives remaining, game win/loss conditions.

## Tech Stack

- **React Native:** Framework for building native mobile apps using React.
- **Expo:** Platform and tools for universal React applications (including Expo Router for navigation).
- **TypeScript:** Superset of JavaScript adding static typing.

## Project Structure

```
.
├── app/                # Expo Router screens and layouts
│   ├── (tabs)/         # (Optional) Tab navigation structure
│   └── sudoku.tsx      # Main Sudoku game screen
├── assets/             # Static assets (images, fonts)
├── components/         # Reusable UI components (SudokuGrid, NumberPad, etc.)
├── hooks/              # Custom React Hooks (useSudokuGame)
├── types/              # TypeScript type definitions (sudokuTypes.ts)
├── utils/              # Utility functions (sudokuUtils.ts)
├── .gitignore
├── babel.config.js
├── package.json
├── tsconfig.json
└── README.md           # This file
```

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the app:**
    - **Using Expo Go:**
      ```bash
      npx expo start
      ```
      Scan the QR code with the Expo Go app on your iOS or Android device.
    - **On iOS Simulator:**
      ```bash
      npx expo run:ios
      ```
    - **On Android Emulator:**
      ```bash
      npx expo run:android
      ```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```
