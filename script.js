// Supabase Configuration
const SUPABASE_URL = 'https://bxhrnnwfqlsoviysqcdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHJubndmcWxzb3ZpeXNxY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODkzNDIsImV4cCI6MjA4MTM2NTM0Mn0.O7fpv0TrDd-8ZE3Z9B5zWyAuWROPis5GRnKMxmqncX8';

// Initialize Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Table names
const LEADERBOARD_TABLE = 'leaderboard_orarps';
const GAME_SESSIONS_TABLE = 'game_sessions';

// Game state
const gameState = {
    // User info
    userId: null,
    username: null,
    isLoggedIn: false,
    
    // Current game session
    currentSessionId: null,
    
    // Game data
    playerScore: 0,
    computerScore: 0,
    playerChoice: null,
    computerChoice: null,
    roundWinner: null,
    gameActive: true,
    isAnimating: false,
    
    // Stats
    currentGameWins: 0,
    currentGameRounds: 0,
    
    // Spinner intervals
    playerSpinnerInterval: null,
    computerSpinnerInterval: null
};

// Screens
const screens = {
    login: document.getElementById('loginScreen'),
    register: document.getElementById('registerScreen'),
    main: document.getElementById('mainScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
    game: document.getElementById('gameScreen'),
    profile: document.getElementById('profileScreen')
};

// Buttons
const buttons = {
    // Login/Register
    login: document.getElementById('loginBtn'),
    register: document.getElementById('registerBtn'),
    gotoRegister: document.getElementById('gotoRegisterBtn'),
    gotoLogin: document.getElementById('gotoLoginBtn'),
    
    // Main Menu
    playGame: document.getElementById('playGameBtn'),
    viewLeaderboard: document.getElementById('viewLeaderboardBtn'),
    viewProfile: document.getElementById('viewProfileBtn'),
    logout: document.getElementById('logoutBtn'),
    
    // Game
    playAgain: document.getElementById('playAgainBtn'),
    backToMenu: document.getElementById('backToMenuBtn'),
    saveScore: document.getElementById('saveScoreBtn'),
    
    // Leaderboard
    backFromLeaderboard: document.getElementById('backFromLeaderboardBtn'),
    
    // Profile
    backFromProfile: document.getElementById('backFromProfileBtn')
};

// Inputs
const inputs = {
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    registerUsername: document.getElementById('registerUsername'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword')
};

// Game elements
const gameElements = {
    playerScore: document.getElementById('playerScore'),
    computerScore: document.getElementById('computerScore'),
    playerChoiceDisplay: document.getElementById('playerChoiceDisplay'),
    computerChoiceDisplay: document.getElementById('computerChoiceDisplay'),
    resultText: document.getElementById('resultText'),
    choicesContainer: document.getElementById('choicesContainer'),
    welcomeMessage: document.getElementById('welcomeMessage'),
    leaderboardList: document.getElementById('leaderboardList'),
    profileStats: document.getElementById('profileStats'),
    currentScore: document.getElementById('currentScore')
};

// Choice buttons
const choiceButtons = document.querySelectorAll('.choice-btn');

// Pilihan yang tersedia
const choices = ['gunting', 'batu', 'kertas'];
const choiceImages = {
    gunting: 'gunting.webp',
    batu: 'batu.webp',
    kertas: 'kertas.webp'
};

// Mapping pilihan untuk hasil
const outcomes = {
    gunting: { beats: 'kertas', losesTo: 'batu' },
    batu: { beats: 'gunting', losesTo: 'kertas' },
    kertas: { beats: 'batu', losesTo: 'gunting' }
};

// Urutan acak untuk animasi
const randomSequences = [
    ['gunting', 'batu', 'kertas'],
    ['batu', 'kertas', 'gunting'],
    ['kertas', 'gunting', 'batu'],
    ['gunting', 'kertas', 'batu'],
    ['batu', 'gunting', 'kertas'],
    ['kertas', 'batu', 'gunting']
];

// Screen navigation functions
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show selected screen
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        
        // Load data for specific screens
        if (screenName === 'leaderboard') {
            loadLeaderboard();
        } else if (screenName === 'profile') {
            loadProfile();
        } else if (screenName === 'main') {
            updateWelcomeMessage();
        }
    }
}

// Hash password sederhana (dalam production gunakan library yang lebih aman)
function hashPassword(password) {
    // Ini adalah hash sederhana untuk demo
    // Dalam aplikasi produksi, gunakan bcrypt atau similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Register function
async function registerUser() {
    const username = inputs.registerUsername.value.trim();
    const password = inputs.registerPassword.value;
    const confirmPassword = inputs.registerConfirmPassword.value;
    
    // Validasi
    if (!username || !password) {
        alert('Username dan password harus diisi!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak cocok!');
        return;
    }
    
    if (username.length < 3) {
        alert('Username minimal 3 karakter!');
        return;
    }
    
    if (password.length < 4) {
        alert('Password minimal 4 karakter!');
        return;
    }
    
    try {
        // Cek apakah username sudah ada
        const { data: existingUser, error: checkError } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            alert('Username sudah digunakan!');
            return;
        }
        
        // Hash password
        const passwordHash = hashPassword(password);
        
        // Buat user baru
        const { data, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .insert([
                {
                    username: username,
                    password_hash: passwordHash,
                    total_score: 0,
                    total_wins: 0,
                    total_games: 0,
                    best_score: 0
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Auto login setelah register
        gameState.userId = data.id;
        gameState.username = data.username;
        gameState.isLoggedIn = true;
        
        alert('Registrasi berhasil!');
        showScreen('main');
        
        // Clear form
        inputs.registerUsername.value = '';
        inputs.registerPassword.value = '';
        inputs.registerConfirmPassword.value = '';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Gagal mendaftar. Coba lagi.');
    }
}

// Login function
async function loginUser() {
    const username = inputs.loginUsername.value.trim();
    const password = inputs.loginPassword.value;
    
    if (!username || !password) {
        alert('Username dan password harus diisi!');
        return;
    }
    
    try {
        // Hash password untuk dicocokkan
        const passwordHash = hashPassword(password);
        
        // Cari user
        const { data: user, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select('*')
            .eq('username', username)
            .eq('password_hash', passwordHash)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                alert('Username atau password salah!');
            } else {
                throw error;
            }
            return;
        }
        
        // Set user state
        gameState.userId = user.id;
        gameState.username = user.username;
        gameState.isLoggedIn = true;
        
        // Clear form
        inputs.loginUsername.value = '';
        inputs.loginPassword.value = '';
        
        showScreen('main');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Gagal login. Coba lagi.');
    }
}

// Logout function
function logoutUser() {
    gameState.userId = null;
    gameState.username = null;
    gameState.isLoggedIn = false;
    
    // Reset game state
    resetGame();
    
    showScreen('login');
}

// Update welcome message
function updateWelcomeMessage() {
    if (gameState.username && gameElements.welcomeMessage) {
        gameElements.welcomeMessage.textContent = `Halo, ${gameState.username}!`;
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        gameElements.leaderboardList.innerHTML = '<div class="loading">Memuat leaderboard...</div>';
        
        const { data: leaders, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select('username, total_score, total_wins, total_games, best_score')
            .order('total_score', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!leaders || leaders.length === 0) {
            gameElements.leaderboardList.innerHTML = '<div class="no-data">Belum ada data leaderboard</div>';
            return;
        }
        
        let leaderboardHTML = '<table class="leaderboard-table">';
        leaderboardHTML += `
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Total Score</th>
                    <th>Total Wins</th>
                    <th>Best Score</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        leaders.forEach((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            leaderboardHTML += `
                <tr class="${rankClass}">
                    <td>${rank}</td>
                    <td>${user.username}</td>
                    <td>${user.total_score}</td>
                    <td>${user.total_wins}</td>
                    <td>${user.best_score}</td>
                </tr>
            `;
        });
        
        leaderboardHTML += '</tbody></table>';
        gameElements.leaderboardList.innerHTML = leaderboardHTML;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        gameElements.leaderboardList.innerHTML = '<div class="error">Gagal memuat leaderboard</div>';
    }
}

// Load profile
async function loadProfile() {
    if (!gameState.userId) return;
    
    try {
        const { data: user, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select('*')
            .eq('id', gameState.userId)
            .single();
        
        if (error) throw error;
        
        const winRate = user.total_games > 0 
            ? Math.round((user.total_wins / user.total_games) * 100) 
            : 0;
        
        gameElements.profileStats.innerHTML = `
            <div class="profile-info">
                <h3>${user.username}</h3>
                <div class="stat-item">
                    <span class="stat-label">Total Score:</span>
                    <span class="stat-value">${user.total_score}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Wins:</span>
                    <span class="stat-value">${user.total_wins}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Games:</span>
                    <span class="stat-value">${user.total_games}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Best Score:</span>
                    <span class="stat-value">${user.best_score}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Win Rate:</span>
                    <span class="stat-value">${winRate}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Last Played:</span>
                    <span class="stat-value">${new Date(user.last_played_at).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        gameElements.profileStats.innerHTML = '<div class="error">Gagal memuat profil</div>';
    }
}

// Start new game session
async function startNewGame() {
    if (!gameState.isLoggedIn) {
        alert('Silakan login terlebih dahulu!');
        showScreen('login');
        return;
    }
    
    // Reset game state
    resetGame();
    
    // Create new game session in database
    try {
        const { data: session, error } = await supabaseClient
            .from(GAME_SESSIONS_TABLE)
            .insert([
                {
                    user_id: gameState.userId,
                    score: 0,
                    wins: 0,
                    total_rounds: 0
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        gameState.currentSessionId = session.id;
        
    } catch (error) {
        console.error('Error creating game session:', error);
        // Continue game even if session creation fails
    }
    
    showScreen('game');
}

// Reset game
function resetGame() {
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    gameState.playerChoice = null;
    gameState.computerChoice = null;
    gameState.roundWinner = null;
    gameState.gameActive = true;
    gameState.isAnimating = false;
    gameState.currentGameWins = 0;
    gameState.currentGameRounds = 0;
    
    // Clear intervals
    if (gameState.playerSpinnerInterval) {
        clearInterval(gameState.playerSpinnerInterval);
        gameState.playerSpinnerInterval = null;
    }
    
    if (gameState.computerSpinnerInterval) {
        clearInterval(gameState.computerSpinnerInterval);
        gameState.computerSpinnerInterval = null;
    }
    
    // Update scores
    gameElements.playerScore.textContent = '0';
    gameElements.computerScore.textContent = '0';
    gameElements.currentScore.textContent = '0';
    
    // Reset displays
    gameElements.playerChoiceDisplay.innerHTML = '<div class="choice-placeholder">PILIH</div>';
    gameElements.computerChoiceDisplay.innerHTML = '<div class="choice-placeholder">MENUNGGU</div>';
    gameElements.resultText.textContent = 'PILIH SALAH SATU';
    gameElements.resultText.className = 'result-text';
    
    // Show choice buttons
    gameElements.choicesContainer.style.display = 'flex';
    
    // Reset choice buttons
    choiceButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.pointerEvents = 'auto';
    });
    
    // Hide save score button
    buttons.saveScore.style.display = 'none';
}

// Make choice vs computer
function makeComputerChoice(choice) {
    if (!gameState.gameActive || gameState.isAnimating) return;
    
    gameState.isAnimating = true;
    gameState.gameActive = false;
    gameState.playerChoice = choice;
    gameState.currentGameRounds++;
    
    // Highlight selected button
    choiceButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-choice') === choice) {
            btn.classList.add('active');
        }
    });
    
    // Hide choice buttons during animation
    gameElements.choicesContainer.style.display = 'none';
    
    // Get AI choice
    gameState.computerChoice = choices[Math.floor(Math.random() * choices.length)];
    
    // Start spinner animations
    gameState.playerSpinnerInterval = createSpinner(gameElements.playerChoiceDisplay, false);
    gameState.computerSpinnerInterval = createSpinner(gameElements.computerChoiceDisplay, true);
    
    // Determine winner
    const winner = determineWinner(choice, gameState.computerChoice);
    
    // After 1.5 seconds, show results
    setTimeout(() => {
        // Stop spinner animations
        if (gameState.playerSpinnerInterval) {
            clearInterval(gameState.playerSpinnerInterval);
            gameState.playerSpinnerInterval = null;
        }
        
        if (gameState.computerSpinnerInterval) {
            clearInterval(gameState.computerSpinnerInterval);
            gameState.computerSpinnerInterval = null;
        }
        
        // Update scores
        if (winner === 'player') {
            gameState.playerScore += 10; // 10 poin per kemenangan
            gameState.currentGameWins++;
            gameElements.resultText.textContent = 'ANDA MENANG +10 POIN!';
            gameElements.resultText.className = 'result-text win';
        } else if (winner === 'computer') {
            gameState.computerScore += 10;
            gameElements.resultText.textContent = 'KOMPUTER MENANG';
            gameElements.resultText.className = 'result-text lose';
        } else {
            gameElements.resultText.textContent = 'SERI';
            gameElements.resultText.className = 'result-text draw';
        }
        
        // Update score displays
        gameElements.playerScore.textContent = gameState.playerScore;
        gameElements.computerScore.textContent = gameState.computerScore;
        gameElements.currentScore.textContent = gameState.playerScore;
        
        // Display final choices
        displayFinalChoice(choice, gameElements.playerChoiceDisplay, true);
        displayFinalChoice(gameState.computerChoice, gameElements.computerChoiceDisplay, false);
        
        // Update game session in database
        updateGameSession();
        
        // Show action buttons
        buttons.playAgain.style.display = 'block';
        buttons.saveScore.style.display = 'block';
        
        gameState.isAnimating = false;
        gameState.gameActive = true;
        
    }, 1500);
}

// Determine winner
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
        return 'draw';
    }
    
    if (outcomes[playerChoice].beats === computerChoice) {
        return 'player';
    }
    
    return 'computer';
}

// Update game session in database
async function updateGameSession() {
    if (!gameState.currentSessionId) return;
    
    try {
        const { error } = await supabaseClient
            .from(GAME_SESSIONS_TABLE)
            .update({
                score: gameState.playerScore,
                wins: gameState.currentGameWins,
                total_rounds: gameState.currentGameRounds,
                updated_at: new Date().toISOString()
            })
            .eq('id', gameState.currentSessionId);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error updating game session:', error);
    }
}

// Save score to leaderboard
async function saveScoreToLeaderboard() {
    if (!gameState.userId || gameState.playerScore === 0) return;
    
    try {
        // Get current user stats
        const { data: user, error: fetchError } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select('*')
            .eq('id', gameState.userId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Calculate new stats
        const newTotalScore = user.total_score + gameState.playerScore;
        const newTotalWins = user.total_wins + gameState.currentGameWins;
        const newTotalGames = user.total_games + 1;
        const newBestScore = Math.max(user.best_score, gameState.playerScore);
        
        // Update user stats
        const { error: updateError } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .update({
                total_score: newTotalScore,
                total_wins: newTotalWins,
                total_games: newTotalGames,
                best_score: newBestScore,
                last_played_at: new Date().toISOString()
            })
            .eq('id', gameState.userId);
        
        if (updateError) throw updateError;
        
        alert(`Score berhasil disimpan! Total score Anda: ${newTotalScore}`);
        
        // Reset current session
        gameState.currentSessionId = null;
        
        // Go back to menu
        showScreen('main');
        
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Gagal menyimpan score. Coba lagi.');
    }
}

// Common functions
function createSpinner(displayElement, isComputer = false) {
    displayElement.innerHTML = '';
    
    const spinnerClass = isComputer ? 'choice-spinner computer-spinner' : 'choice-spinner player-spinner';
    const spinner = document.createElement('div');
    spinner.className = spinnerClass;
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'spinner-container';
    
    const img = document.createElement('img');
    img.className = 'spinner-image fast-switch';
    spinnerContainer.appendChild(img);
    
    spinner.appendChild(spinnerContainer);
    displayElement.appendChild(spinner);
    
    const randomSeqIndex = Math.floor(Math.random() * randomSequences.length);
    const sequence = randomSequences[randomSeqIndex];
    
    let currentIndex = 0;
    const spinnerInterval = setInterval(() => {
        const currentChoice = sequence[currentIndex];
        img.src = choiceImages[currentChoice];
        img.alt = currentChoice;
        currentIndex = (currentIndex + 1) % 3;
    }, 120);
    
    return spinnerInterval;
}

function displayFinalChoice(choice, displayElement, isPlayer = true) {
    displayElement.innerHTML = '';
    
    displayElement.className = isPlayer ? 'choice-display player-choice' : 'choice-display computer-choice';
    
    const img = document.createElement('img');
    img.src = choiceImages[choice];
    img.alt = choice;
    
    displayElement.appendChild(img);
    
    setTimeout(() => {
        img.classList.add('pulse');
        
        setTimeout(() => {
            if (img.classList) {
                img.classList.remove('pulse');
            }
        }, 500);
    }, 10);
}

// Event listeners
buttons.gotoRegister.addEventListener('click', () => {
    showScreen('register');
});

buttons.gotoLogin.addEventListener('click', () => {
    showScreen('login');
});

buttons.register.addEventListener('click', registerUser);
buttons.login.addEventListener('click', loginUser);

buttons.playGame.addEventListener('click', startNewGame);
buttons.viewLeaderboard.addEventListener('click', () => {
    showScreen('leaderboard');
});
buttons.viewProfile.addEventListener('click', () => {
    if (!gameState.isLoggedIn) {
        alert('Silakan login terlebih dahulu!');
        showScreen('login');
        return;
    }
    showScreen('profile');
});
buttons.logout.addEventListener('click', logoutUser);

buttons.playAgain.addEventListener('click', () => {
    resetGame();
    buttons.saveScore.style.display = 'none';
});

buttons.backToMenu.addEventListener('click', () => {
    showScreen('main');
});

buttons.saveScore.addEventListener('click', saveScoreToLeaderboard);

buttons.backFromLeaderboard.addEventListener('click', () => {
    showScreen('main');
});

buttons.backFromProfile.addEventListener('click', () => {
    showScreen('main');
});

// Choice button event listeners
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        const choice = button.getAttribute('data-choice');
        makeComputerChoice(choice);
    });
});

// Initialize
function initialize() {
    // Check if user is already logged in (from localStorage)
    const savedUserId = localStorage.getItem('orarps_userId');
    const savedUsername = localStorage.getItem('orarps_username');
    
    if (savedUserId && savedUsername) {
        gameState.userId = savedUserId;
        gameState.username = savedUsername;
        gameState.isLoggedIn = true;
        showScreen('main');
    } else {
        showScreen('login');
    }
}

// Start the game
initialize();