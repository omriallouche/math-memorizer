# Math Memory Game

A comprehensive educational game platform designed for children to practice various subjects including math, vocabulary, and language learning. The game features multiple game types, user management, progress tracking, and engaging visual rewards.

## Available Games

### 1. Math (חשבון)
- **Description**: Practice arithmetic operations (addition, subtraction, multiplication, division)
- **Features**: 
  - Choose specific numbers to practice (1-20)
  - Select operations (addition, subtraction, multiplication, division)
  - Multiple choice mode with 4 options
  - Cards matching mode
  - Timer tracking
  - Progressive character image reveal
- **Exercise Count**: 42 problems
- **Difficulty**: Basic to intermediate

### 2. Hebrew Vocabulary (אוצר מילים עברית)
- **Description**: Advanced Hebrew vocabulary building
- **Features**:
  - Multiple choice questions with 4 options
  - Advanced vocabulary words with definitions
  - Categories: abstract concepts, academic terms
  - No timer (focus on accuracy)
- **Exercise Count**: 35 problems
- **Difficulty**: Advanced

### 3. English Sounds (צלילי אנגלית)
- **Description**: English pronunciation and vocabulary practice
- **Features**:
  - Hebrew to English word matching
  - Phonetic pronunciation guides
  - Categories: animals, colors, numbers, family, food
  - Multiple choice with 4 options
- **Exercise Count**: 35 problems
- **Difficulty**: Beginner to intermediate

### 4. Gifted Youth Math (מחוננים)
- **Description**: Advanced math problems for gifted students
- **Features**:
  - Word problems (single and multi-step)
  - Number series and patterns
  - Arithmetic calculations with missing numbers
  - Shape-based number puzzles
  - Multiple choice format
- **Exercise Count**: 25 problems
- **Difficulty**: Advanced

### 5. English Language (אנגלית)
- **Description**: Basic English vocabulary learning
- **Features**:
  - Hebrew to English translation
  - Categories: animals, colors, numbers, family, food
  - Multiple choice with 4 options
  - Timer enabled
- **Exercise Count**: 30 problems
- **Difficulty**: Beginner

## Game Features

### User Management
- Create and manage multiple user profiles
- Individual progress tracking per user
- User-specific statistics and performance data

### Game Modes
- **Standard Mode**: Answer questions and press spacebar to continue
- **Multiple Choice Mode**: Choose from 4 answer options
- **Cards Matching Mode**: Match pairs of related items

### Visual Rewards
- Progressive character image reveal as you complete exercises
- Grid overlay system that reveals portions of character images
- Different character images for each game session

### Progress Tracking
- Response time tracking for each question
- Accuracy statistics
- Performance review by difficulty level
- Slowest exercises identification
- Total time tracking

### Customization Options
- Timer on/off toggle
- Category selection (where applicable)
- Number range selection (for math games)
- Operation selection (for math games)

## How to Run Locally

### Option 1: Using Node.js Server (Recommended)
1. **Prerequisites**: Install Node.js on your system
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the server**:
   ```bash
   npm start
   ```
4. **Access the game**: 
   - **Root path**: `http://localhost:3000` (for development)
   - **GitHub Pages compatible**: `http://localhost:3000/math-memorizer/` (matches production)

The server is configured to work with both paths, so you can use either URL locally.

### Option 2: Direct File System Access
1. **Simple setup**: Open `index.html` directly in your web browser
2. **Note**: Some features may be limited without the server (image loading, game configurations)

### Option 3: GitHub Pages (Live Demo)
The game is also available online at: [https://omriallouche.github.io/math-memorizer/](https://omriallouche.github.io/math-memorizer/)

### Server Features
- Serves static files from the project directory
- Provides API endpoints for game configurations
- Lists available character images
- CORS enabled for cross-origin requests
- Request logging for debugging

## Setup Requirements

### Images Setup
1. Create an `images` folder in the project root
2. Add character images (supported formats: jpg, jpeg, png)
3. Name images as `character1.jpg`, `character2.jpg`, etc.
4. The server will automatically detect and serve these images

### Game Configurations
- Game configurations are stored in YAML format in the `configs/` folder
- Each game type has its own configuration file
- Configurations define exercise content, categories, and game settings

## How to Play

### Basic Gameplay
1. **Select Game Type**: Choose from the available games in the dropdown
2. **Choose User**: Select or create a user profile
3. **Configure Options**: 
   - Select operations (for math games)
   - Choose categories (for language games)
   - Pick number ranges (for math games)
   - Toggle timer and game modes
4. **Start Game**: Click "התחל משחק" (Start Game)
5. **Answer Questions**: 
   - Say the answer out loud
   - Press spacebar or click "הבא" (Next) to continue
   - For multiple choice: click the correct answer
6. **View Results**: See your statistics and slowest exercises

### Game Controls
- **Spacebar**: Move to next question (standard mode)
- **Mouse**: Click buttons and options
- **Pause Button**: Pause/resume timer during gameplay

## Tips for Parents and Educators

### Getting Started
- Begin with simpler games (English Language, basic Math)
- Start with smaller number ranges and fewer categories
- Use the tutorial feature to understand each game type

### Progress Tracking
- Review statistics regularly to identify areas needing practice
- Focus on exercises that took the longest time
- Use the review feature to practice specific difficulty levels

### Engagement
- Encourage verbal responses before clicking answers
- Celebrate completion of each game session
- Use the character reveal as motivation to complete exercises
- Take breaks between game sessions

## Technical Requirements

- **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)
- **JavaScript**: Must be enabled
- **Internet**: Not required after initial setup (for file system access)
- **Node.js**: Required for server mode (v14 or higher recommended)
- **Storage**: Local storage used for user data and progress tracking

## File Structure

```
math_memory_from_scratch/
├── index.html              # Main game interface
├── game.js                 # Game logic and functionality
├── styles.css              # Styling and layout
├── server.js               # Node.js server
├── package.json            # Dependencies and scripts
├── images/                 # Character images directory
├── configs/                # Game configuration files
│   ├── math.yaml          # Math game configuration
│   ├── hebrew_vocabulary.yaml
│   ├── english_sounds.yaml
│   ├── gifted_youth_math.yaml
│   ├── language.yaml
│   └── list-games.json
└── audio/                  # Sound effects
    └── success.mp3
``` 