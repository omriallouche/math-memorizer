# Timer Configuration Feature

## Overview

The math memory game now supports configurable timer display through YAML configuration files. This allows game administrators to control whether the timer is shown during gameplay.

## Configuration

### YAML Setting

Add the `showTimer` setting to your game configuration:

```yaml
math_game:
  type: "math"
  name: "משחק זיכרון מתמטי"
  description: "תרגול פעולות חשבון"
  showTimer: true  # Set to false to hide the timer
  # ... rest of configuration
```

### Values

- `showTimer: true` - Timer is displayed during gameplay (default)
- `showTimer: false` - Timer is hidden during gameplay

## Behavior

### When Timer is Hidden (`showTimer: false`)

1. **Visual Elements Hidden**: Both the individual exercise timer and total time display are hidden
2. **Time Tracking Continues**: Time is still tracked internally for statistics and end-game results
3. **Statistics Preserved**: All timing data is still collected and available in the statistics screen
4. **End Game Display**: Total time is hidden in the end game screen

### When Timer is Shown (`showTimer: true`)

1. **Full Timer Display**: Both individual exercise timer and total time are visible
2. **Real-time Updates**: Timer updates in real-time during gameplay
3. **End Game Display**: Total time is shown in the end game screen

## Example Configurations

### Math Game with Timer (Default)
```yaml
math_game:
  type: "math"
  name: "משחק זיכרון מתמטי"
  description: "תרגול פעולות חשבון"
  showTimer: true
  # ... rest of configuration
```

### Math Game without Timer
```yaml
math_game:
  type: "math"
  name: "משחק זיכרון מתמטי (ללא טיימר)"
  description: "תרגול פעולות חשבון ללא הצגת זמן"
  showTimer: false
  # ... rest of configuration
```

## Implementation Details

### Files Modified

1. **YAML Configuration Files**:
   - `configs/math.yaml` - Added `showTimer: true`
   - `configs/language.yaml` - Added `showTimer: true`
   - `configs/gifted_youth_math.yaml` - Added `showTimer: true`
   - `configs/math_no_timer.yaml` - New file with `showTimer: false`

2. **JavaScript Code** (`game.js`):
   - Added `isTimerShown()` method to `GameConfig` class
   - Modified `startGame()` to control timer visibility
   - Modified `startTimer()` and `startTotalTimer()` to respect configuration
   - Modified `endGame()` to conditionally show total time
   - Updated game type handling to support `math_no_timer`

3. **HTML** (`index.html`):
   - Added new game type button for "מתמטיקה ללא טיימר"

### Key Methods

- `GameConfig.isTimerShown()` - Returns whether timer should be displayed
- `MathMemoryGame.startGame()` - Controls timer visibility based on configuration
- `MathMemoryGame.startTimer()` - Only starts timer if configured to show
- `MathMemoryGame.startTotalTimer()` - Always tracks time but only displays if configured

## Usage

1. **For Regular Games**: Use `showTimer: true` (default behavior)
2. **For Stress-Free Practice**: Use `showTimer: false` to remove time pressure
3. **For Assessment**: Use `showTimer: false` to focus on accuracy without time pressure
4. **For Speed Training**: Use `showTimer: true` to encourage faster responses

## Benefits

1. **Flexibility**: Game administrators can choose timer display based on learning objectives
2. **Reduced Anxiety**: Hiding timer can reduce performance anxiety for some students
3. **Focus on Accuracy**: Without timer pressure, students can focus on correct answers
4. **Data Preservation**: Time tracking continues even when timer is hidden
5. **Easy Configuration**: Simple YAML setting controls the feature 