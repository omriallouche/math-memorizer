// Game Configuration Class - handles different game types
class GameConfig {
    constructor() {
        this.gameType = 'math'; // 'math', 'language', 'gifted'
        this.config = null;
        this.selectedCategories = new Set();
        // Config is now loaded asynchronously in MathMemoryGame.initGame()
    }

    async loadYamlConfig(filePath) {
        try {
            const response = await fetch(filePath);
            const yamlText = await response.text();
            return jsyaml.load(yamlText);
        } catch (error) {
            console.error('Error loading or parsing YAML file:', error);
            return null;
        }
    }

    async setGameType(type) {
        this.gameType = type;
        const configMap = {
            'math': { path: 'configs/math.yaml', key: 'math_game' },
            'language': { path: 'configs/language.yaml', key: 'language_game' },
            'gifted': { path: 'configs/gifted_youth_math.yaml', key: 'gifted_youth_game' }
        };

        const configInfo = configMap[type];

        if (configInfo) {
            const { path, key } = configInfo;
            try {
                const loadedConfig = await this.loadYamlConfig(path);
                if (loadedConfig && loadedConfig[key]) {
                    this.config = loadedConfig[key];
                    this.config.type = type; // Ensure type is set
                    // For language and gifted, the number of exercises is determined by the content list
                    if (this.config.content && (type === 'language' || type === 'gifted')) {
                        // this.config.exerciseCount = this.config.content.length;
                        this.config.exerciseCount = 20;
                    }
                } else {
                    console.error(`Failed to load or parse config for type: ${type} from ${path}`);
                    this.config = {}; // Set a default empty config on failure
                }
            } catch (error) {
                console.error(`Error during config loading for type ${type}:`, error);
                this.config = {};
            }
        } else {
            console.warn(`Unknown game type: "${type}". Defaulting to math.`);
            if (this.gameType !== 'math') { // prevent infinite recursion
                await this.setGameType('math');
            }
        }
    }

    getOperationSymbol(operation) {
        return this.config.operations[operation]?.symbol || operation;
    }

    getOperationName(operation) {
        return this.config.operations[operation]?.name || operation;
    }

    isOperationEnabled(operation) {
        return this.config.operations[operation]?.enabled || false;
    }

    getEnabledOperations() {
        return Object.keys(this.config.operations).filter(op => this.isOperationEnabled(op));
    }

    getCategoryName(category) {
        return this.config.categories[category]?.name || category;
    }

    isCategoryEnabled(category) {
        return this.config.categories[category]?.enabled || false;
    }

    getEnabledCategories() {
        return Object.keys(this.config.categories).filter(cat => this.isCategoryEnabled(cat));
    }

    generateExercise(selectedNumbers, enabledOperations) {
        if (this.config.type === 'math') {
            return this.generateMathExercise(selectedNumbers, enabledOperations);
        } else if (this.config.type === 'language') {
            return this.generateLanguageExercise();
        } else if (this.config.type === 'gifted') {
            return this.generateGiftedExercise();
        }
        return null;
    }

    generateMathExercise(selectedNumbers, enabledOperations) {
        const numbers = Array.from(selectedNumbers);
        const num1 = numbers[Math.floor(Math.random() * numbers.length)];
        const num2 = numbers[Math.floor(Math.random() * numbers.length)];
        const operation = enabledOperations[Math.floor(Math.random() * enabledOperations.length)];
        
        let result;
        switch (operation) {
            case 'addition':
                result = num1 + num2;
                break;
            case 'subtraction':
                if (num1 < num2) return this.generateMathExercise(selectedNumbers, enabledOperations);
                result = num1 - num2;
                break;
            case 'multiplication':
                result = num1 * num2;
                break;
            case 'division':
                if (num2 === 0) return this.generateMathExercise(selectedNumbers, enabledOperations);
                result = num1 / num2;
                if (result > 20 || !Number.isInteger(result)) {
                    return this.generateMathExercise(selectedNumbers, enabledOperations);
                }
                break;
        }
        
        return {
            type: 'math',
            question: `${num1} ${this.getOperationSymbol(operation)} ${num2} = ?`,
            correctAnswer: result,
            data: { num1, num2, operation }
        };
    }

    generateLanguageExercise() {
        // Filter content by selected categories
        const availableContent = this.config.content.filter(
            item => this.selectedCategories.has(item.category)
        );
        
        if (availableContent.length === 0) {
            // If no categories selected, use all content
            const randomItem = this.config.content[Math.floor(Math.random() * this.config.content.length)];
            return {
                type: 'language',
                question: randomItem.hebrew,
                correctAnswer: randomItem.english,
                data: randomItem
            };
        }
        
        const randomItem = availableContent[Math.floor(Math.random() * availableContent.length)];
        
        return {
            type: 'language',
            question: randomItem.hebrew,
            correctAnswer: randomItem.english,
            data: randomItem
        };
    }

    generateGiftedExercise() {
        const availableContent = this.config.content.filter(
            item => this.selectedCategories.size === 0 || this.selectedCategories.has(item.category)
        );

        if (availableContent.length === 0) {
            return null; // Or handle case with no available exercises
        }

        const randomItem = availableContent[Math.floor(Math.random() * availableContent.length)];
        
        return {
            type: 'gifted',
            question: randomItem.question,
            correctAnswer: randomItem.answer,
            choices: randomItem.choices,
            data: randomItem
        };
    }

    generateChoices(correctAnswer, exerciseData) {
        if (this.config.type === 'math') {
            return this.generateMathChoices(correctAnswer, exerciseData);
        } else if (this.config.type === 'language') {
            return this.generateLanguageChoices(correctAnswer, exerciseData);
        } else if (this.config.type === 'gifted') {
            // For gifted, choices are pre-defined in the exercise data
            const choices = [...exerciseData.choices, correctAnswer];
            // Shuffle
            for (let i = choices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }
            return choices;
        }
        return [];
    }

    generateMathChoices(correctAnswer, exerciseData) {
        const choices = [correctAnswer];
        const used = new Set([correctAnswer]);
        const constraints = this.config.multipleChoice.constraints;
        
        while (choices.length < this.config.multipleChoice.choiceCount) {
            let wrong;
            if (exerciseData.operation === 'division') {
                wrong = correctAnswer + (Math.floor(Math.random() * 7) - 3);
                if (wrong === correctAnswer || wrong <= 0 || wrong > 20) continue;
                if (exerciseData.num1 % wrong !== 0) continue;
            } else {
                wrong = correctAnswer + (Math.floor(Math.random() * 11) - 5);
                if (wrong === correctAnswer || 
                    (constraints.nonNegative && wrong < 0) || 
                    wrong > constraints.maxValue) continue;
            }
            if (!used.has(wrong)) {
                choices.push(wrong);
                used.add(wrong);
            }
        }
        
        // Shuffle choices
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        return choices;
    }

    generateLanguageChoices(correctAnswer, exerciseData) {
        const choices = [correctAnswer];
        const used = new Set([correctAnswer]);
        
        // Get all other English words from the same category
        const sameCategoryWords = this.config.content
            .filter(item => item.category === exerciseData.category && item.english !== correctAnswer)
            .map(item => item.english);
        
        // Get some words from other categories
        const otherCategoryWords = this.config.content
            .filter(item => item.category !== exerciseData.category)
            .map(item => item.english);
        
        // Add words from same category first
        for (const word of sameCategoryWords) {
            if (choices.length >= this.config.multipleChoice.choiceCount) break;
            if (!used.has(word)) {
                choices.push(word);
                used.add(word);
            }
        }
        
        // Fill remaining slots with words from other categories
        for (const word of otherCategoryWords) {
            if (choices.length >= this.config.multipleChoice.choiceCount) break;
            if (!used.has(word)) {
                choices.push(word);
                used.add(word);
            }
        }
        
        // If we still don't have enough choices, add some random English words
        const commonWords = ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'do', 'does', 'can', 'will', 'would', 'could', 'should'];
        for (const word of commonWords) {
            if (choices.length >= this.config.multipleChoice.choiceCount) break;
            if (!used.has(word)) {
                choices.push(word);
                used.add(word);
            }
        }
        
        // Shuffle choices
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        return choices;
    }

    checkAnswer(userAnswer, correctAnswer) {
        return userAnswer === correctAnswer;
    }
}

class MathMemoryGame {
    constructor() {
        this.gameConfig = new GameConfig();
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
        this.currentCategory = null;
        this.isPaused = false;
        this.totalTime = 0;
        this.totalTimerInterval = null;
        this.pauseStartTime = 0;
        this.currentUser = null;
        this.users = new Map();
        this.successAudio = new Audio('audio/success.mp3');
        this.successAudio.volume = 0.5; // Optional: set volume lower if needed
        this.multipleChoiceMode = false;

        this.initGame();
    }

    async initGame() {
        await this.gameConfig.setGameType('math');
        await this.loadImages();
        this.loadUsers();
        this.initializeUI();
        this.setupEventListeners();
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
                'images/character10.jpg',
                'images/character11.jpg',
                'images/character12.jpg',
                'images/character13.jpg',
                'images/character14.jpg',
                'images/character15.jpg',
                'images/character16.jpg',
                'images/character17.jpg',
                'images/character18.jpg',
                'images/character19.jpg',
                'images/character20.jpg',
                'images/character21.jpg',
                'images/character22.jpg',
                'images/character23.jpg',
                'images/character24.jpg',
                'images/character25.jpg',
                'images/character26.jpg',
                'images/character27.jpg',
                'images/character28.jpg',
                'images/character29.jpg',
                'images/character30.jpg',
                'images/character31.jpg',
                'images/character32.jpg',
                'images/character33.jpg',
                'images/character34.jpg',
                'images/character35.jpg',
                'images/character36.jpg',
                'images/character37.jpg',
                'images/character38.jpg',
                'images/character39.jpg',
                'images/character40.jpg',
                'images/character41.jpg',
                'images/character42.jpg',
                'images/character43.jpg',
                'images/character44.jpg',
                'images/character45.jpg',
                'images/character46.jpg',
                'images/character47.jpg',
                'images/character48.jpg',
                'images/character49.jpg',
                'images/character50.jpg',
                'images/character51.jpg',
                'images/character52.jpg',
                'images/character53.jpg',
                'images/character54.jpg',
                'images/character55.jpg',
                'images/character56.jpg',
                'images/character57.jpg',
                'images/character58.jpg',
                'images/character59.jpg',
                'images/character60.jpg',
                'images/character61.jpg',
                'images/character62.jpg',
                'images/character63.jpg',
                'images/character64.jpg',
                'images/character65.jpg',
                'images/character66.jpg',
                'images/character67.jpg',
                'images/character68.jpg',
                'images/character69.jpg',
                'images/character70.jpg',
                'images/character71.jpg',
                'images/character72.jpg',
                'images/character73.jpg',
                'images/character74.jpg',
                'images/character75.jpg',
                'images/character76.jpg',
                'images/character77.jpg',
                'images/character78.jpg',
                'images/character79.jpg',
                'images/character80.jpg',
                'images/character81.jpg',
                'images/character82.jpg',
                'images/character83.jpg',
                'images/character84.jpg',
                'images/character85.jpg',
                'images/character86.jpg',
                'images/character87.jpg',
                'images/character88.jpg',
                'images/character89.jpg',
                'images/character90.jpg',
                'images/character91.jpg',
                'images/character92.jpg',
                'images/character93.jpg',
                'images/character94.jpg',
                'images/character95.jpg',
                'images/character96.jpg',
                'images/character97.jpg',
                'images/character98.jpg',
                'images/character99.jpg',
                'images/character100.jpg',
                'images/character101.jpg'                
            ];
            this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
        }
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('mathGameUsers');
        if (savedUsers) {
            this.users = new Map(JSON.parse(savedUsers));
        }

        if (this.users.size === 0) {
            // Add a default user if none exist
            this.addUser('אורח'); // "Guest" in Hebrew
        } else {
            // Select the first user if one exists
            const firstUser = this.users.keys().next().value;
            this.selectUser(firstUser);
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
                // Ensure the map for the operation/category exists
                if (!this.exerciseTimes[operation]) {
                    this.exerciseTimes[operation] = new Map();
                }
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
        if (!userId) {
            this.currentUser = null;
            this.updateUserSelect();
            // Maybe clear settings or use defaults
            this.operations = { addition: true, subtraction: true, multiplication: false, division: false };
            this.selectedNumbers = new Set();
            return;
        }

        this.currentUser = userId;
        this.loadUserSettings(userId);
        this.loadUserStats();
        this.updateUserSelect();
        // Maybe other UI updates are needed here when a user is switched
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
        this.updateUserSelect();
        this.setupGameTypeSelection();
        this.setupCategorySelection();
        this.setupNumberSelection();

        const multipleChoiceCheckbox = document.getElementById('multipleChoiceMode');
        multipleChoiceCheckbox.checked = this.multipleChoiceMode;
        multipleChoiceCheckbox.addEventListener('change', (e) => {
            this.multipleChoiceMode = e.target.checked;
        });
    }

    setupGameTypeSelection() {
        const buttons = document.querySelectorAll('.game-type-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                this.selectGameType(type);

                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    setupGrid() {
        const gridOverlay = document.getElementById('gridOverlay');
        gridOverlay.innerHTML = '';
        this.gridCells = [];
        for (let i = 0; i < this.gameConfig.config.exerciseCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridOverlay.appendChild(cell);
            this.gridCells.push(cell);
        }
    }

    setupNumberSelection() {
        const numberGrid = document.querySelector('.number-grid');
        numberGrid.innerHTML = '';
        const selectedNumbers = this.selectedNumbers || new Set();

        for (let i = 1; i <= 20; i++) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = i;
            checkbox.checked = selectedNumbers.has(i);
            
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
            label.appendChild(document.createTextNode(` ${i}`));
            numberGrid.appendChild(label);
        }
    }

    async selectGameType(type) {
        this.isGameActive = false;
        await this.gameConfig.setGameType(type);
        document.querySelector('h1').textContent = this.gameConfig.config.name;
        this.updateUIForGameType(type);
        this.updateUserList(); // Also re-initiate user
        this.setupCategorySelection();
    }

    updateUIForGameType(type) {
        const operationSelection = document.getElementById('operationSelection');
        const numberSelection = document.getElementById('numberSelection');
        const categorySelection = document.getElementById('categorySelection');
        const multipleChoiceToggle = document.getElementById('multipleChoiceMode').parentElement;
        const multipleChoiceCheckbox = document.getElementById('multipleChoiceMode');

        if (type === 'math') {
            operationSelection.style.display = 'block';
            numberSelection.style.display = 'block';
            categorySelection.style.display = 'none';
            multipleChoiceToggle.style.display = 'block';
            multipleChoiceCheckbox.disabled = false;
        } else if (type === 'language') {
            operationSelection.style.display = 'none';
            numberSelection.style.display = 'none';
            categorySelection.style.display = 'block';
            multipleChoiceToggle.style.display = 'block';
            multipleChoiceCheckbox.checked = true;
            multipleChoiceCheckbox.disabled = true;
        } else if (type === 'gifted') {
            operationSelection.style.display = 'none';
            numberSelection.style.display = 'none';
            categorySelection.style.display = 'block';
            multipleChoiceToggle.style.display = 'block';
            multipleChoiceCheckbox.checked = true;
            multipleChoiceCheckbox.disabled = true;
        }
    }

    setupCategorySelection() {
        const categorySelection = document.getElementById('categorySelection');
        if (!categorySelection) return;

        const categoryGrid = categorySelection.querySelector('.category-grid');
        if (!categoryGrid) return;

        categoryGrid.innerHTML = ''; // Clear existing categories

        if (this.gameConfig.config.categories) {
            const categories = this.gameConfig.config.categories;
            for (const categoryKey in categories) {
                const category = categories[categoryKey];
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.category = categoryKey;
                checkbox.checked = true; // Default to checked
                
                this.gameConfig.selectedCategories.add(categoryKey);

                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.gameConfig.selectedCategories.add(categoryKey);
                    } else {
                        this.gameConfig.selectedCategories.delete(categoryKey);
                    }
                });

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${category.name}`));
                categoryGrid.appendChild(label);
            }
        }
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
            if (this.gameConfig.config.type === 'math') {
                // Math game validation
                if (this.selectedNumbers.size === 0) {
                    alert('אנא בחר לפחות מספר אחד!');
                    return;
                }
                if (!Object.values(this.operations).some(v => v)) {
                    alert('אנא בחר לפחות פעולה אחת!');
                    return;
                }
            } else if (this.gameConfig.config.type === 'language') {
                // Language game validation
                if (this.gameConfig.selectedCategories.size === 0) {
                    alert('אנא בחר לפחות קטגוריה אחת!');
                    return;
                }
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
            if (e.code === 'Space' && 
                this.currentExercise < 20 && 
                !this.isPaused && 
                document.getElementById('gameScreen').style.display === 'block') {
                if (this.multipleChoiceMode) return; // Prevent spacebar in multiple choice mode
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

        document.getElementById('showReview').addEventListener('click', (e) => {
            e.preventDefault();
            this.showReview();
        });

        document.getElementById('backFromReview').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideReview();
        });

        // Add event listeners for review tabs
        document.querySelectorAll('.review-tabs .tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.review-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.updateReviewList();
            });
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
        
        // Update stats tabs based on game type
        this.updateStatsTabs();
        
        this.updateStatsTable();
    }

    updateStatsTabs() {
        const statsTabs = document.getElementById('statsTabs');
        const statsDescription = document.getElementById('statsDescription');
        
        statsTabs.innerHTML = '';
        
        if (this.gameConfig.config.type === 'math') {
            // Math game tabs
            const operations = ['addition', 'subtraction', 'multiplication', 'division'];
            operations.forEach((operation, index) => {
                const button = document.createElement('button');
                button.className = `tab-button ${index === 0 ? 'active' : ''}`;
                button.dataset.operation = operation;
                button.textContent = this.gameConfig.getOperationName(operation);
                button.addEventListener('click', (e) => {
                    this.currentOperation = e.target.dataset.operation;
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                    this.updateStatsTable();
                });
                statsTabs.appendChild(button);
            });
            
            statsDescription.textContent = 'זמנים ממוצעים בשניות לכל שילוב:';
        } else if (this.gameConfig.config.type === 'language') {
            // Language game tabs
            const categories = this.gameConfig.getEnabledCategories();
            categories.forEach((category, index) => {
                const button = document.createElement('button');
                button.className = `tab-button ${index === 0 ? 'active' : ''}`;
                button.dataset.category = category;
                button.textContent = this.gameConfig.getCategoryName(category);
                button.addEventListener('click', (e) => {
                    this.currentCategory = e.target.dataset.category;
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                    this.updateStatsTable();
                });
                statsTabs.appendChild(button);
            });
            
            statsDescription.textContent = 'זמנים ממוצעים בשניות לכל מילה:';
        }
        
        // Set initial current operation/category
        if (this.gameConfig.config.type === 'math') {
            this.currentOperation = 'addition';
        } else if (this.gameConfig.config.type === 'language') {
            this.currentCategory = this.gameConfig.getEnabledCategories()[0];
        }
    }

    hideStats() {
        document.getElementById('statsScreen').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
    }

    showReview() {
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('reviewScreen').style.display = 'block';
        document.getElementById('currentReviewUserName').textContent = this.users.get(this.currentUser);
        this.updateReviewList();
    }

    hideReview() {
        document.getElementById('reviewScreen').style.display = 'none';
        document.getElementById('gameSetup').style.display = 'block';
    }

    updateReviewList() {
        const reviewContainer = document.querySelector('.review-container');
        reviewContainer.innerHTML = '';

        // Get the current operation from the active tab
        const activeTab = document.querySelector('.review-tabs .tab-button.active');
        const operation = activeTab.dataset.operation;

        // Get all exercises for the current operation
        const exercises = Array.from(this.exerciseTimes[operation].entries())
            .filter(([_, times]) => times.length > 0) // Only include exercises with recorded times
            .map(([key, times]) => {
                // Parse key like '5addition3' to extract num1, operation, num2
                const match = key.match(/^(\d+)([a-z]+)(\d+)$/);
                let num1, num2;
                if (match) {
                    num1 = Number(match[1]);
                    num2 = Number(match[3]);
                } else {
                    num1 = num2 = NaN;
                }
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length / 1000; // Convert to seconds
                return { num1, num2, avgTime, key };
            })
            .sort((a, b) => b.avgTime - a.avgTime); // Sort by average time (slowest first)

        if (exercises.length === 0) {
            reviewContainer.innerHTML = '<p>אין תרגילים עם נתונים</p>';
            return;
        }

        const exerciseList = document.createElement('div');
        exerciseList.className = 'exercise-list';

        exercises.forEach(({ num1, num2, avgTime }) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'exercise-item';
            
            let operationSymbol;
            switch (operation) {
                case 'addition': operationSymbol = '+'; break;
                case 'subtraction': operationSymbol = '-'; break;
                case 'multiplication': operationSymbol = '×'; break;
                case 'division': operationSymbol = '÷'; break;
            }

            // Calculate result using game config
            const exercise = this.gameConfig.generateMathExercise([num1], [operation]);
            const result = exercise ? exercise.correctAnswer : '?';
            exerciseItem.textContent = `${num1} ${operationSymbol} ${num2} = ${result} (${avgTime.toFixed(1)}s)`;
            exerciseList.appendChild(exerciseItem);
        });

        reviewContainer.appendChild(exerciseList);
    }

    generateExercises() {
        this.exercises = [];
        
        if (this.gameConfig.config.type === 'math') {
            const activeOperations = Object.entries(this.operations)
                .filter(([_, active]) => active)
                .map(([op]) => op);
            
            // Generate exercises using the game config
            for (let i = 0; i < this.gameConfig.config.exerciseCount; i++) {
                const exercise = this.gameConfig.generateExercise(this.selectedNumbers, activeOperations);
                if (exercise) {
                    this.exercises.push(exercise);
                }
            }
        } else if (this.gameConfig.config.type === 'language' || this.gameConfig.config.type === 'gifted') {
            // Generate language or gifted exercises
            for (let i = 0; i < this.gameConfig.config.exerciseCount; i++) {
                const exercise = this.gameConfig.generateExercise();
                if (exercise) {
                    this.exercises.push(exercise);
                }
            }
        }
    }

    startGame() {
        this.setupGrid();
        this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
        this.generateExercises();

        if (this.exercises.length === 0) {
            alert('No exercises were loaded. Please check the category selection or game configuration.');
            document.getElementById('gameScreen').style.display = 'none';
            document.getElementById('gameSetup').style.display = 'block';
            return;
        }
        
        this.currentExercise = 0;
        this.isPaused = false;
        this.gridCells.forEach(cell => cell.style.opacity = '1');
        
        // Generate random reveal order
        this.revealOrder = Array.from({length: this.gameConfig.config.exerciseCount}, (_, i) => i);
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
        // Read multiple choice mode from checkbox
        const mcCheckbox = document.getElementById('multipleChoiceMode');
        this.multipleChoiceMode = mcCheckbox && mcCheckbox.checked;
        this.showNextExercise();
    }

    showNextExercise() {
        if (this.currentExercise >= this.gameConfig.config.exerciseCount) {
            this.endGame();
            return;
        }
        
        const exercise = this.exercises[this.currentExercise];
        
        // Display the question
        document.getElementById('exercise').textContent = exercise.question;
        document.getElementById('progressText').textContent = 
            `${this.currentExercise + 1}/${this.gameConfig.config.exerciseCount}`;
        document.querySelector('.progress-bar').style.width = 
            `${((this.currentExercise + 1) / this.gameConfig.config.exerciseCount) * 100}%`;
        
        this.startTime = Date.now();
        this.startTimer();

        // Multiple choice logic
        const mcContainer = document.getElementById('multipleChoiceContainer');
        const nextBtn = document.getElementById('nextButton');
        
        if (this.multipleChoiceMode) {
            // Hide next button
            nextBtn.style.display = 'none';
            
            // Generate choices using game config
            const choices = this.gameConfig.generateChoices(exercise.correctAnswer, exercise.data);
            
            // Render buttons
            mcContainer.innerHTML = '';
            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice;
                btn.onclick = () => {
                    if (this.gameConfig.checkAnswer(choice, exercise.correctAnswer)) {
                        this.handleAnswer();
                    } else {
                        btn.classList.add('choice-btn-wrong');
                        btn.disabled = true;
                    }
                };
                mcContainer.appendChild(btn);
            });
        } else {
            // Not multiple choice: hide container, show next button
            mcContainer.innerHTML = '';
            nextBtn.style.display = '';
        }
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
        // Play success sound
        if (this.successAudio) {
            // Rewind to start if already playing
            this.successAudio.currentTime = 0;
            this.successAudio.play();
        }
        const timeTaken = Date.now() - this.startTime;
        clearInterval(this.timerInterval);
        
        const exercise = this.exercises[this.currentExercise];
        
        // For math exercises, track times by operation
        if (exercise.type === 'math') {
            const exerciseKey = `${exercise.data.num1}${exercise.data.operation}${exercise.data.num2}`;
            
            if (!this.exerciseTimes[exercise.data.operation].has(exerciseKey)) {
                this.exerciseTimes[exercise.data.operation].set(exerciseKey, []);
            }
            this.exerciseTimes[exercise.data.operation].get(exerciseKey).push(timeTaken);
            this.saveUserStats();
        } else if (exercise.type === 'language') {
            // For language exercises, track times by category
            const category = exercise.data.category;
            if (!this.exerciseTimes[category]) {
                this.exerciseTimes[category] = new Map();
            }
            const exerciseKey = `${exercise.data.hebrew}-${exercise.data.english}`;
            if (!this.exerciseTimes[category].has(exerciseKey)) {
                this.exerciseTimes[category].set(exerciseKey, []);
            }
            this.exerciseTimes[category].get(exerciseKey).push(timeTaken);
            this.saveUserStats();
        }

        // Reveal next grid cell in random order
        this.gridCells[this.revealOrder[this.currentExercise]].style.opacity = '0';
        
        this.currentExercise++;
        this.showNextExercise();
    }

    updateStatsTable() {
        const statsContainer = document.querySelector('.stats-container');
        statsContainer.innerHTML = '';
        
        if (this.gameConfig.config.type === 'math') {
            this.updateMathStatsTable(statsContainer);
        } else if (this.gameConfig.config.type === 'language') {
            this.updateLanguageStatsTable(statsContainer);
        }
    }

    updateMathStatsTable(statsContainer) {
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
        
        statsContainer.appendChild(table);
    }

    updateLanguageStatsTable(statsContainer) {
        const table = document.createElement('table');
        table.className = 'stats-table';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>מילה בעברית</th><th>תרגום באנגלית</th><th>זמן ממוצע (שניות)</th><th>מספר ניסיונות</th>';
        table.appendChild(headerRow);
        
        // Get all words from the current category
        const categoryWords = this.gameConfig.config.content.filter(
            item => item.category === this.currentCategory
        );
        
        // Create data rows
        categoryWords.forEach(word => {
            const row = document.createElement('tr');
            const key = `${word.hebrew}-${word.english}`;
            const times = this.exerciseTimes[this.currentCategory]?.get(key) || [];
            const avgTime = times.length ? 
                (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1) : 
                '-';
            
            row.innerHTML = `
                <td>${word.hebrew}</td>
                <td>${word.english}</td>
                <td>${avgTime}</td>
                <td>${times.length}</td>
            `;
            table.appendChild(row);
        });
        
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

        // Hide game screen, show end screen
        document.getElementById('gameScreen').style.display = 'none';
        const endScreen = document.getElementById('endScreen');
        endScreen.style.display = 'block';

        // Show character image
        const endCharacterContainer = document.getElementById('endCharacterContainer');
        endCharacterContainer.innerHTML = `<img src="${this.characterImages[this.currentCharacter]}" alt="Disney Character">`;

        // Show total time
        document.getElementById('endTotalTime').textContent = `סה\"כ זמן: ${this.totalTime.toFixed(1)} שניות`;

        // Find 5 slowest exercises from this session (for math exercises)
        const slowestExercisesDiv = document.getElementById('slowestExercises');
        let sessionExercises = [];
        
        if (this.gameConfig.config.type === 'math') {
            sessionExercises = this.exercises
                .filter(ex => ex.type === 'math')
                .map((ex, idx) => {
                    const time = this.exerciseTimes[ex.data.operation].get(`${ex.data.num1}${ex.data.operation}${ex.data.num2}`);
                    return {
                        ...ex,
                        time: time ? time[time.length - 1] : 0,
                        idx
                    };
                });
        } else if (this.gameConfig.config.type === 'language') {
            sessionExercises = this.exercises
                .filter(ex => ex.type === 'language')
                .map((ex, idx) => {
                    const category = ex.data.category;
                    const key = `${ex.data.hebrew}-${ex.data.english}`;
                    const time = this.exerciseTimes[category]?.get(key);
                    return {
                        ...ex,
                        time: time ? time[time.length - 1] : 0,
                        idx
                    };
                });
        }
        
        // Sort by time descending, take 5
        const slowest = sessionExercises.sort((a, b) => b.time - a.time).slice(0, 5);
        slowestExercisesDiv.innerHTML = '';
        slowest.forEach((exercise) => {
            const div = document.createElement('div');
            div.className = 'exercise-item';
            
            if (exercise.type === 'math') {
                div.textContent = `${exercise.question} (${(exercise.time/1000).toFixed(1)}s)`;
            } else if (exercise.type === 'language') {
                div.textContent = `${exercise.data.hebrew} → ${exercise.data.english} (${(exercise.time/1000).toFixed(1)}s)`;
            }
            
            slowestExercisesDiv.appendChild(div);
        });

        // Back to setup button
        document.getElementById('backToSetupButton').onclick = () => {
            endScreen.style.display = 'none';
            document.getElementById('gameSetup').style.display = 'block';
            // Select a random character for next game
            this.currentCharacter = Math.floor(Math.random() * this.characterImages.length);
        };
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MathMemoryGame();
}); 