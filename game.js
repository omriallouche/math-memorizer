class MathMemoryGame {
    constructor() {
        this.exercises = [];
        this.currentExercise = 0;
        this.startTime = 0;
        this.exerciseTimes = {
            addition: new Map(),
            subtraction: new Map(),
            multiplication: new Map(),
            division: new Map()
        };
        this.selectedNumbers = new Set();
        this.operations = {
            addition: true,
            subtraction: true,
            multiplication: false,
            division: false
        };
        this.gridCells = [];
        this.characterImages = [];
        this.currentCharacter = 0;
        this.revealOrder = [];
        this.timerInterval = null;
        this.currentOperation = 'addition';
        this.isPaused = false;
        this.totalTime = 0;
        this.totalTimerInterval = null;
        this.pauseStartTime = 0;
        this.currentUser = null;
        this.users = new Map();

        this.loadImages().then(() => {
            this.loadUsers();
            this.initializeUI();
            this.setupEventListeners();
        });
    }

    async loadImages() {
        try {
            const response = await fetch('/list-images');
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const images = await response.json();
            if (!Array.isArray(images) || images.length === 0) {
                throw new Error('No images found in the response');
            }
            this.characterImages = images.map(img => `images/${img}`);
            this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
        } catch (error) {
            console.error('Error loading images:', error);
            console.log('Falling back to default images. Make sure the server is running with "npm start"');
            // Fallback to default images if server request fails
            this.characterImages = [
                'images/character1.jpg',
                'images/character2.jpg',
                'images/character3.jpg',
                'images/character4.jpg',
                'images/character5.jpg',
                'images/character6.jpg',
                'images/character7.jpg',
                'images/character8.jpg',
                'images/character9.jpg',
                'images/character10.jpg'
            ];
            this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
        }
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('mathGameUsers');
        if (savedUsers) {
            this.users = new Map(JSON.parse(savedUsers));
            // Select the first user if one exists
            const firstUser = this.users.keys().next().value;
            if (firstUser) {
                this.selectUser(firstUser);
            }
        }
    }

    saveUsers() {
        localStorage.setItem('mathGameUsers', JSON.stringify(Array.from(this.users.entries())));
    }

    loadUserSettings(userId) {
        const savedSettings = localStorage.getItem(`mathGameSettings_${userId}`);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.operations = settings.operations;
            this.selectedNumbers = new Set(settings.selectedNumbers);
        } else {
            // Default settings
            this.operations = {
                addition: true,
                subtraction: true,
                multiplication: false,
                division: false
            };
            this.selectedNumbers = new Set();
        }
    }

    saveUserSettings() {
        if (!this.currentUser) return;
        const settings = {
            operations: this.operations,
            selectedNumbers: Array.from(this.selectedNumbers)
        };
        localStorage.setItem(`mathGameSettings_${this.currentUser}`, JSON.stringify(settings));
    }

    loadUserStats() {
        if (!this.currentUser) return;
        const savedTimes = localStorage.getItem(`mathGameTimes_${this.currentUser}`);
        if (savedTimes) {
            const timesData = JSON.parse(savedTimes);
            Object.keys(timesData).forEach(operation => {
                timesData[operation].forEach(([key, times]) => {
                    this.exerciseTimes[operation].set(key, times);
                });
            });
        } else {
            // Reset stats
            this.exerciseTimes = {
                addition: new Map(),
                subtraction: new Map(),
                multiplication: new Map(),
                division: new Map()
            };
        }
    }

    saveUserStats() {
        if (!this.currentUser) return;
        const timesData = {};
        Object.keys(this.exerciseTimes).forEach(operation => {
            timesData[operation] = Array.from(this.exerciseTimes[operation].entries());
        });
        localStorage.setItem(`mathGameTimes_${this.currentUser}`, JSON.stringify(timesData));
    }

    addUser(name) {
        const userId = Date.now().toString();
        this.users.set(userId, name);
        this.saveUsers();
        this.updateUserList();
        this.updateUserSelect();
        return userId;
    }

    removeUser(userId) {
        this.users.delete(userId);
        this.saveUsers();
        this.updateUserList();
        this.updateUserSelect();
        
        // If the removed user was current, select another user
        if (this.currentUser === userId) {
            const firstUser = this.users.keys().next().value;
            if (firstUser) {
                this.selectUser(firstUser);
            } else {
                this.currentUser = null;
                this.initializeUI();
            }
        }
    }

    selectUser(userId) {
        this.currentUser = userId;
        this.loadUserSettings(userId);
        this.loadUserStats();
        this.initializeUI();
    }

    updateUserList() {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        
        this.users.forEach((name, id) => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <span>${name}</span>
                <button data-user-id="${id}">מחק</button>
            `;
            userList.appendChild(userItem);
        });
    }

    updateUserSelect() {
        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '';
        
        this.users.forEach((name, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            if (id === this.currentUser) {
                option.selected = true;
            }
            userSelect.appendChild(option);
        });
    }

    initializeUI() {
        // Update user selection
        this.updateUserList();
        this.updateUserSelect();

        // Create number checkboxes
        const numberGrid = document.querySelector('.number-grid');
        numberGrid.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = i;
            checkbox.checked = this.selectedNumbers.has(i);
            checkbox.addEventListener('change', (e) => {
                const num = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedNumbers.add(num);
                } else {
                    this.selectedNumbers.delete(num);
                }
                this.saveUserSettings();
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(i));
            numberGrid.appendChild(label);
        }

        // Set operation checkboxes
        Object.keys(this.operations).forEach(operation => {
            const checkbox = document.getElementById(operation);
            checkbox.checked = this.operations[operation];
            checkbox.addEventListener('change', (e) => {
                this.operations[operation] = e.target.checked;
                this.saveUserSettings();
            });
        });

        // Create grid overlay
        const gridOverlay = document.getElementById('gridOverlay');
        gridOverlay.innerHTML = '';
        this.gridCells = []; // Clear the grid cells array
        for (let i = 0; i < 20; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridOverlay.appendChild(cell);
            this.gridCells.push(cell);
        }

        // Initialize stats table
        this.updateStatsTable();
    }

    setupEventListeners() {
        // User management
        document.getElementById('addUser').addEventListener('click', () => {
            const nameInput = document.getElementById('newUserName');
            const name = nameInput.value.trim();
            if (name) {
                const userId = this.addUser(name);
                this.selectUser(userId);
                nameInput.value = '';
            }
        });

        document.getElementById('userList').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const userId = e.target.dataset.userId;
                if (confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
                    this.removeUser(userId);
                }
            }
        });

        document.getElementById('userSelect').addEventListener('change', (e) => {
            this.selectUser(e.target.value);
        });

        document.getElementById('manageUsers').addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserManagement();
        });

        document.getElementById('backToGameFromUsers').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideUserManagement();
        });

        // Operation checkboxes
        Object.keys(this.operations).forEach(operation => {
            document.getElementById(operation).addEventListener('change', (e) => {
                this.operations[operation] = e.target.checked;
                this.saveUserSettings();
            });
        });

        // Number checkboxes
        document.querySelectorAll('.number-grid input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const num = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedNumbers.add(num);
                } else {
                    this.selectedNumbers.delete(num);
                }
                this.saveUserSettings();
            });
        });

        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            if (this.selectedNumbers.size === 0) {
                alert('אנא בחר לפחות מספר אחד!');
                return;
            }
            if (!Object.values(this.operations).some(v => v)) {
                alert('אנא בחר לפחות פעולה אחת!');
                return;
            }
            this.startGame();
        });

        // View stats link
        document.getElementById('viewStats').addEventListener('click', (e) => {
            e.preventDefault();
            this.showStats();
        });

        // Back to game link
        document.getElementById('backToGame').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideStats();
        });

        // Show tutorial link
        document.getElementById('showTutorial').addEventListener('click', (e) => {
            e.preventDefault();
            this.showTutorial();
        });

        // Back from tutorial link
        document.getElementById('backFromTutorial').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideTutorial();
        });

        // Stats tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.currentOperation = e.target.dataset.operation;
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                this.updateStatsTable();
            });
        });

        // Pause button
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });

        // Spacebar listener
        document.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.code);
            console.log('Game screen visible:', document.getElementById('gameScreen').style.display === 'block');
            console.log('Current exercise:', this.currentExercise);
            console.log('Is paused:', this.isPaused);
            
            if (e.code === 'Space' && 
                this.currentExercise < 20 && 
                !this.isPaused && 
                document.getElementById('gameScreen').style.display === 'block') {
                e.preventDefault();
                this.handleAnswer();
            }
        });

        // Next button listener
        document.getElementById('nextButton').addEventListener('click', () => {
            if (this.currentExercise < 20 && 
                !this.isPaused && 
                document.getElementById('gameScreen').style.display === 'block') {
                this.handleAnswer();
            }
        });
    }

    showUserManagement() {
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('statsScreen').style.display = 'none';
        document.getElementById('tutorialScreen').style.display = 'none';
        document.getElementById('userManagement').style.display = 'block';
    }

    hideUserManagement() {
        document.getElementById('userManagement').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
    }

    showTutorial() {
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('statsScreen').style.display = 'none';
        document.getElementById('userManagement').style.display = 'none';
        document.getElementById('tutorialScreen').style.display = 'block';
    }

    hideTutorial() {
        document.getElementById('tutorialScreen').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
    }

    showStats() {
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('tutorialScreen').style.display = 'none';
        document.getElementById('userManagement').style.display = 'none';
        document.getElementById('statsScreen').style.display = 'block';
        
        // Update current user name display
        const currentUserName = document.getElementById('currentUserName');
        if (this.currentUser && this.users.has(this.currentUser)) {
            currentUserName.textContent = `משתמש: ${this.users.get(this.currentUser)}`;
        } else {
            currentUserName.textContent = '';
        }
        
        this.updateStatsTable();
    }

    hideStats() {
        document.getElementById('statsScreen').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
    }

    generateExercises() {
        this.exercises = [];
        const numbers = Array.from(this.selectedNumbers);
        const activeOperations = Object.entries(this.operations)
            .filter(([_, active]) => active)
            .map(([op]) => op);
        
        // Calculate median times for each exercise type
        const medianTimes = {};
        Object.keys(this.exerciseTimes).forEach(operation => {
            medianTimes[operation] = new Map();
            this.exerciseTimes[operation].forEach((times, key) => {
                if (times.length > 0) {
                    const sortedTimes = [...times].sort((a, b) => a - b);
                    medianTimes[operation].set(key, sortedTimes[Math.floor(sortedTimes.length / 2)]);
                }
            });
        });

        // Create exercise pool with weights based on median times
        const exercisePool = [];
        numbers.forEach(num1 => {
            numbers.forEach(num2 => {
                activeOperations.forEach(operation => {
                    let isValid = true;
                    let result;

                    switch (operation) {
                        case 'addition':
                            result = num1 + num2;
                            break;
                        case 'subtraction':
                            // For subtraction, we want to match num2 and result
                            if (num1 < num2) return;
                            result = num1 - num2;
                            break;
                        case 'multiplication':
                            result = num1 * num2;
                            break;
                        case 'division':
                            // For division, num1 is the desired result (quotient)
                            // and num2 is the denominator
                            // Both should be ≤ 20
                            if (num2 === 0) return;
                            if (num1 > 20) return; // Result should be ≤ 20
                            result = num1;
                            break;
                    }

                    // Calculate weight based on median time
                    const key = `${num1}${operation}${num2}`;
                    const medianTime = medianTimes[operation].get(key) || 0;
                    const weight = Math.max(1, Math.ceil(medianTime / 1000)); // Convert to seconds and ensure minimum weight of 1

                    // Add exercise to pool multiple times based on weight
                    for (let i = 0; i < weight; i++) {
                        exercisePool.push({ num1, num2, operation, result });
                    }
                });
            });
        });

        // Select 20 exercises from the pool
        while (this.exercises.length < 20 && exercisePool.length > 0) {
            const randomIndex = Math.floor(Math.random() * exercisePool.length);
            const exercise = exercisePool[randomIndex];
            
            // For subtraction and division, ensure we're using the correct numbers
            if (exercise.operation === 'subtraction') {
                this.exercises.push({
                    num1: exercise.num2 + exercise.result,
                    num2: exercise.num2,
                    operation: exercise.operation
                });
            } else if (exercise.operation === 'division') {
                // For division, num2 is the denominator and result is the quotient
                // We calculate the numerator as denominator * quotient
                const numerator = exercise.num2 * exercise.result;
                this.exercises.push({
                    num1: numerator,
                    num2: exercise.num2,
                    operation: exercise.operation
                });
            } else {
                this.exercises.push({
                    num1: exercise.num1,
                    num2: exercise.num2,
                    operation: exercise.operation
                });
            }
            
            // Remove the selected exercise from the pool
            exercisePool.splice(randomIndex, 1);
        }

        // If we don't have enough exercises, fill with random ones
        while (this.exercises.length < 20) {
            const num1 = numbers[Math.floor(Math.random() * numbers.length)];
            const num2 = numbers[Math.floor(Math.random() * numbers.length)];
            const operation = activeOperations[Math.floor(Math.random() * activeOperations.length)];
            
            if (operation === 'subtraction' && num1 < num2) continue;
            if (operation === 'division') {
                if (num2 === 0) continue;
                // For division, ensure we have a valid whole number result
                const result = num1;
                if (result > 20) continue; // Result should be ≤ 20
                const numerator = num2 * result;
                this.exercises.push({
                    num1: numerator,
                    num2: num2,
                    operation: operation
                });
                continue;
            }
            
            this.exercises.push({ num1, num2, operation });
        }
    }

    startGame() {
        this.generateExercises();
        this.currentExercise = 0;
        this.isPaused = false;
        this.gridCells.forEach(cell => cell.style.opacity = '1');
        
        // Generate random reveal order
        this.revealOrder = Array.from({length: 20}, (_, i) => i);
        for (let i = this.revealOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.revealOrder[i], this.revealOrder[j]] = [this.revealOrder[j], this.revealOrder[i]];
        }
        
        // Load character image
        const characterContainer = document.getElementById('characterContainer');
        characterContainer.innerHTML = `<img src="${this.characterImages[this.currentCharacter]}" alt="Disney Character">`;
        
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('statsScreen').style.display = 'none';
        document.getElementById('tutorialScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        this.startTotalTimer();
        this.showNextExercise();
    }

    showNextExercise() {
        if (this.currentExercise >= 20) {
            this.endGame();
            return;
        }

        const exercise = this.exercises[this.currentExercise];
        const operationSymbols = {
            addition: '+',
            subtraction: '-',
            multiplication: '×',
            division: '/'
        };
        
        document.getElementById('exercise').textContent = 
            `${exercise.num1} ${operationSymbols[exercise.operation]} ${exercise.num2} = ?`;
        
        document.getElementById('progressText').textContent = 
            `${this.currentExercise + 1}/20`;
        document.querySelector('.progress-bar').style.width = 
            `${((this.currentExercise + 1) / 20) * 100}%`;
        
        this.startTime = Date.now();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        const timerElement = document.getElementById('timer');
        timerElement.textContent = '0.0s';
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                timerElement.textContent = `${elapsed.toFixed(1)}s`;
            }
        }, 100);
    }

    startTotalTimer() {
        if (this.totalTimerInterval) {
            clearInterval(this.totalTimerInterval);
        }
        const totalTimerElement = document.getElementById('totalTimer');
        this.totalTime = 0;
        totalTimerElement.textContent = `סה"כ זמן: 0.0s`;
        
        this.totalTimerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.totalTime += 0.1;
                totalTimerElement.textContent = `סה"כ זמן: ${this.totalTime.toFixed(1)}s`;
            }
        }, 100);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pauseButton');
        
        if (this.isPaused) {
            pauseButton.classList.add('paused');
            this.pauseStartTime = Date.now();
        } else {
            pauseButton.classList.remove('paused');
            // Adjust start time to account for pause duration
            const pauseDuration = Date.now() - this.pauseStartTime;
            this.startTime += pauseDuration;
        }
    }

    handleAnswer() {
        const timeTaken = Date.now() - this.startTime;
        clearInterval(this.timerInterval);
        
        const exercise = this.exercises[this.currentExercise];
        const exerciseKey = `${exercise.num1}${exercise.operation}${exercise.num2}`;
        
        if (!this.exerciseTimes[exercise.operation].has(exerciseKey)) {
            this.exerciseTimes[exercise.operation].set(exerciseKey, []);
        }
        this.exerciseTimes[exercise.operation].get(exerciseKey).push(timeTaken);
        this.saveUserStats();

        // Reveal next grid cell in random order
        this.gridCells[this.revealOrder[this.currentExercise]].style.opacity = '0';
        
        this.currentExercise++;
        this.showNextExercise();
    }

    updateStatsTable() {
        const statsContainer = document.querySelector('.stats-container');
        const table = document.createElement('table');
        table.className = 'stats-table';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th></th>' + Array.from({length: 20}, (_, i) => `<th>${i + 1}</th>`).join('');
        table.appendChild(headerRow);
        
        // Create data rows
        for (let i = 1; i <= 20; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `<th>${i}</th>` + 
                Array.from({length: 20}, (_, j) => {
                    const key = `${i}${this.currentOperation}${j + 1}`;
                    const times = this.exerciseTimes[this.currentOperation].get(key) || [];
                    const median = times.length ? 
                        (times.sort((a, b) => a - b)[Math.floor(times.length / 2)] / 1000).toFixed(1) : 
                        '-';
                    return `<td>${median}</td>`;
                }).join('');
            table.appendChild(row);
        }
        
        statsContainer.innerHTML = '';
        statsContainer.appendChild(table);
    }

    endGame() {
        // Clear all timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.totalTimerInterval) {
            clearInterval(this.totalTimerInterval);
        }
        
        // Show completion message with total time
        alert(`כל הכבוד! השלמת את כל התרגילים!\nסה"כ זמן: ${this.totalTime.toFixed(1)} שניות`);
        
        // Reset game
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
        
        // Select a random character for next game
        this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MathMemoryGame();
}); 