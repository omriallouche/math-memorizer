# Game Architecture Documentation

## Overview

The game has been refactored to separate game configuration from UI and game logic. This allows for easy creation of different game types (math, language, memory, etc.) using external configuration files.

## Architecture Components

### 1. GameConfig Class
- **Purpose**: Handles game type configuration and exercise generation
- **Location**: `game.js` (lines 1-150)
- **Responsibilities**:
  - Load game configuration from external files (YAML)
  - Generate exercises based on game type
  - Generate multiple choice options
  - Validate answers

### 2. MathMemoryGame Class
- **Purpose**: Main game controller and UI manager
- **Location**: `game.js` (lines 151+)
- **Responsibilities**:
  - UI management and event handling
  - Game state management
  - User progress tracking
  - Statistics and scoring

### 3. Configuration Files
- **Purpose**: Define game types and content
- **Format**: YAML
- **Location**: `config-examples.yaml` (examples)
- **Content**: Game rules, content, scoring, UI settings

## Adding New Game Types

### Step 1: Create Configuration File
Create a YAML file for your game type:

```yaml
language_game:
  type: "language"
  name: "משחק שפה"
  description: "תרגול אנגלית"
  categories:
    animals:
      name: "חיות"
      enabled: true
  exerciseCount: 15
  multipleChoice:
    enabled: true
    choiceCount: 4
  content:
    - hebrew: "כלב"
      english: "dog"
      category: "animals"
      audio: "audio/animals/dog.mp3"
```

### Step 2: Extend GameConfig Class
Add methods to handle your game type:

```javascript
// In GameConfig class
generateLanguageExercise(selectedCategories) {
    // Filter content by selected categories
    const availableContent = this.config.content.filter(
        item => selectedCategories.includes(item.category)
    );
    
    const randomItem = availableContent[Math.floor(Math.random() * availableContent.length)];
    
    return {
        type: 'language',
        question: randomItem.hebrew,
        correctAnswer: randomItem.english,
        data: randomItem
    };
}

generateLanguageChoices(correctAnswer, exerciseData) {
    // Generate wrong answers from other content
    const choices = [correctAnswer];
    // ... generate distractors
    return choices;
}
```

### Step 3: Update UI Components
Modify the UI to handle your game type:

```javascript
// In MathMemoryGame class
initializeUI() {
    if (this.gameConfig.config.type === 'language') {
        // Show category selection instead of number selection
        this.showCategorySelection();
    } else {
        // Show number selection for math games
        this.showNumberSelection();
    }
}
```

## Configuration Structure

### Common Properties
- `type`: Game type identifier
- `name`: Display name
- `description`: Game description
- `exerciseCount`: Number of exercises per game
- `multipleChoice`: Multiple choice settings
- `scoring`: Scoring and tracking settings

### Game-Specific Properties
- **Math**: `operations`, `numberRange`
- **Language**: `categories`, `content`
- **Memory**: `categories`, `content`

## File Structure

```
project/
├── game.js              # Main game logic
├── index.html           # UI structure
├── styles.css           # Styling
├── config-examples.yaml # Example configurations
├── ARCHITECTURE.md      # This documentation
├── audio/               # Audio files
├── images/              # Image files
└── configs/             # Game configuration files
    ├── math.yaml
    ├── language.yaml
    └── memory.yaml
```

## Future Enhancements

1. **YAML Parser**: Add YAML parsing library to load external configs
2. **Content Management**: Create content management system for images/audio
3. **Game Type Selector**: Add UI to select different game types
4. **Plugin System**: Allow third-party game type plugins
5. **Analytics**: Track performance across different game types

## Benefits of This Architecture

1. **Separation of Concerns**: Game logic separated from configuration
2. **Extensibility**: Easy to add new game types
3. **Maintainability**: Changes to game rules don't require code changes
4. **Reusability**: UI components can be reused across game types
5. **Configuration-Driven**: Game behavior controlled by external files 