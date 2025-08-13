// FCS Study Tool JavaScript
let questions = [];
let scenarios = [];
let terms = [];
let currentQuestionIndex = 0;
let currentScenarioIndex = 0;
let currentFlashcardIndex = 0;
let questionAnswers = {};
let scenarioAnswers = {};
let filteredQuestions = [];
let filteredScenarios = [];
let filteredTerms = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeEventListeners();
    initializeFilters();
    showMode('questions');
    loadProgress();
});

// Load JSON data
async function loadData() {
    try {
        const [questionsData, scenariosData, termsData] = await Promise.all([
            fetch('questions.json').then(r => r.json()),
            fetch('scenarios.json').then(r => r.json()),
            fetch('terms.json').then(r => r.json())
        ]);
        
        questions = questionsData.questions;
        scenarios = scenariosData.scenarios;
        terms = termsData.terms;
        
        filteredQuestions = [...questions];
        filteredScenarios = [...scenarios];
        filteredTerms = [...terms];
        
        displayQuestion();
        displayScenario();
        displayTerms();
        updateFlashcards();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading study materials. Please refresh the page.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            showMode(mode);
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // View Manual button
    document.getElementById('viewManualBtn').addEventListener('click', () => {
        window.open('https://www.provider.wellpoint.com/docs/gpp/WA_WLP_CAID_ProviderManualFCS.pdf?v=202406202111', '_blank');
    });

    // Question navigation
    document.getElementById('prevQuestion').addEventListener('click', () => navigateQuestion(-1));
    document.getElementById('nextQuestion').addEventListener('click', () => navigateQuestion(1));

    // Scenario navigation
    document.getElementById('prevScenario').addEventListener('click', () => navigateScenario(-1));
    document.getElementById('nextScenario').addEventListener('click', () => navigateScenario(1));

    // Flashcard navigation
    document.getElementById('prevFlashcard').addEventListener('click', () => navigateFlashcard(-1));
    document.getElementById('nextFlashcard').addEventListener('click', () => navigateFlashcard(1));
    document.getElementById('shuffleFlashcards').addEventListener('click', shuffleFlashcards);

    // Flashcard flip
    document.getElementById('flashcard').addEventListener('click', function() {
        this.classList.toggle('flipped');
        // Track flashcard review for gamification
        if (!this.classList.contains('flipped')) {
            gamification.onFlashcardReviewed();
        }
    });

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', filterQuestions);
    document.getElementById('difficultyFilter').addEventListener('change', filterQuestions);
    document.getElementById('scenarioDifficultyFilter').addEventListener('change', filterScenarios);
    document.getElementById('termCategoryFilter').addEventListener('change', filterTerms);
    document.getElementById('flashcardCategoryFilter').addEventListener('change', updateFlashcards);
    document.getElementById('flashcardMode').addEventListener('change', updateFlashcards);
    document.getElementById('termSearch').addEventListener('input', filterTerms);

    // Reset buttons
    document.getElementById('resetQuestions').addEventListener('click', resetQuestions);
    document.getElementById('resetScenarios').addEventListener('click', resetScenarios);
}

// Initialize filters
function initializeFilters() {
    // Question categories
    const categories = [...new Set(questions.map(q => q.category))].sort();
    const categorySelect = document.getElementById('categoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Term categories
    const termCategories = [...new Set(terms.map(t => t.category))].sort();
    const termCategorySelect = document.getElementById('termCategoryFilter');
    const flashcardCategorySelect = document.getElementById('flashcardCategoryFilter');
    termCategories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat;
        option1.textContent = cat;
        termCategorySelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = cat;
        option2.textContent = cat;
        flashcardCategorySelect.appendChild(option2);
    });
}

// Show/hide modes
function showMode(mode) {
    document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${mode}Mode`).classList.add('active');
    
    // Handle gamification dashboard
    if (mode === 'progress') {
        renderGamificationDashboard();
    }
}

// Question functionality
function displayQuestion() {
    if (filteredQuestions.length === 0) return;

    const question = filteredQuestions[currentQuestionIndex];
    document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1} of ${filteredQuestions.length}`;
    document.getElementById('questionDifficulty').textContent = question.difficulty;
    document.getElementById('questionDifficulty').className = `difficulty-badge ${question.difficulty.toLowerCase()}`;
    document.getElementById('questionText').textContent = question.text;

    // Display options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    Object.entries(question.options).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `<span class="option-key">${key}:</span> ${value}`;
        optionDiv.dataset.key = key;
        
        // Check if already answered
        const answerId = question.id;
        if (questionAnswers[answerId]) {
            if (key === question.correct) {
                optionDiv.classList.add('correct');
            }
            if (key === questionAnswers[answerId] && key !== question.correct) {
                optionDiv.classList.add('incorrect');
            }
            if (key === questionAnswers[answerId]) {
                optionDiv.classList.add('selected');
            }
        } else {
            optionDiv.addEventListener('click', () => selectAnswer(key, question));
        }
        
        optionsContainer.appendChild(optionDiv);
    });

    // Show explanation if answered
    if (questionAnswers[question.id]) {
        showExplanation(question);
    } else {
        document.getElementById('explanationContainer').style.display = 'none';
    }

    updateQuestionStats();
}

function selectAnswer(key, question) {
    questionAnswers[question.id] = key;
    saveProgress();
    
    // Track for gamification
    const isCorrect = key === question.correct;
    const answered = filteredQuestions.filter(q => questionAnswers[q.id]).length;
    const correct = filteredQuestions.filter(q => questionAnswers[q.id] === q.correct).length;
    
    // Check if this is a test completion
    if (answered === filteredQuestions.length && filteredQuestions.length >= 20) {
        gamification.onFullTestCompleted(correct, filteredQuestions.length);
    } else if (answered > 0 && answered % 10 === 0) {
        // Practice test every 10 questions
        gamification.onPracticeTestCompleted(correct, answered);
    }
    
    // Update category score if filtering by category
    const category = document.getElementById('categoryFilter').value;
    if (category !== 'all' && answered > 0) {
        gamification.lastCategoryScore = Math.round((correct / answered) * 100);
    }
    
    displayQuestion();
}

function showExplanation(question) {
    const container = document.getElementById('explanationContainer');
    container.style.display = 'block';
    document.getElementById('explanationText').textContent = question.explanation;
    
    const studyPagesDiv = document.getElementById('studyPages');
    if (question.studyPages && question.studyPages.length > 0) {
        studyPagesDiv.innerHTML = `<strong>Study Pages:</strong> ${question.studyPages.join(', ')}`;
    } else {
        studyPagesDiv.innerHTML = '';
    }
}

function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < filteredQuestions.length) {
        currentQuestionIndex = newIndex;
        displayQuestion();
    }
}

function filterQuestions() {
    const category = document.getElementById('categoryFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;
    
    filteredQuestions = questions.filter(q => {
        const categoryMatch = category === 'all' || q.category === category;
        const difficultyMatch = difficulty === 'all' || q.difficulty.toLowerCase() === difficulty;
        return categoryMatch && difficultyMatch;
    });
    
    currentQuestionIndex = 0;
    displayQuestion();
    
    // Check category scores for gamification
    if (category !== 'all') {
        const categoryAnswered = filteredQuestions.filter(q => questionAnswers[q.id]).length;
        const categoryCorrect = filteredQuestions.filter(q => questionAnswers[q.id] === q.correct).length;
        if (categoryAnswered > 0) {
            const categoryScore = Math.round((categoryCorrect / categoryAnswered) * 100);
            gamification.lastCategoryScore = categoryScore;
        }
    }
}

function updateQuestionStats() {
    const answered = filteredQuestions.filter(q => questionAnswers[q.id]).length;
    const correct = filteredQuestions.filter(q => questionAnswers[q.id] === q.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    document.getElementById('questionProgress').textContent = `${answered}/${filteredQuestions.length}`;
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
}

// Scenario functionality
function displayScenario() {
    if (filteredScenarios.length === 0) return;

    const scenario = filteredScenarios[currentScenarioIndex];
    document.getElementById('scenarioTitle').textContent = scenario.title;
    document.getElementById('scenarioDifficulty').textContent = scenario.difficulty;
    document.getElementById('scenarioDifficulty').className = `difficulty-badge ${scenario.difficulty}`;
    document.getElementById('scenarioDescription').textContent = scenario.description;
    document.getElementById('scenarioQuestion').textContent = scenario.question;

    // Display options
    const optionsContainer = document.getElementById('scenarioOptionsContainer');
    optionsContainer.innerHTML = '';
    
    Object.entries(scenario.options).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `<span class="option-key">${key}:</span> ${value}`;
        optionDiv.dataset.key = key;
        
        // Check if already answered
        const answerId = scenario.id;
        if (scenarioAnswers[answerId]) {
            if (key === scenario.correct) {
                optionDiv.classList.add('correct');
            }
            if (key === scenarioAnswers[answerId] && key !== scenario.correct) {
                optionDiv.classList.add('incorrect');
            }
            if (key === scenarioAnswers[answerId]) {
                optionDiv.classList.add('selected');
            }
        } else {
            optionDiv.addEventListener('click', () => selectScenarioAnswer(key, scenario));
        }
        
        optionsContainer.appendChild(optionDiv);
    });

    // Show explanation if answered
    if (scenarioAnswers[scenario.id]) {
        showScenarioExplanation(scenario);
    } else {
        document.getElementById('scenarioExplanationContainer').style.display = 'none';
    }

    updateScenarioStats();
}

function selectScenarioAnswer(key, scenario) {
    scenarioAnswers[scenario.id] = key;
    saveProgress();
    
    // Track for gamification
    gamification.onScenarioCompleted();
    
    displayScenario();
}

function showScenarioExplanation(scenario) {
    const container = document.getElementById('scenarioExplanationContainer');
    container.style.display = 'block';
    document.getElementById('scenarioExplanationText').textContent = scenario.explanation;
    
    const studyPagesDiv = document.getElementById('scenarioStudyPages');
    if (scenario.studyPages && scenario.studyPages.length > 0) {
        studyPagesDiv.innerHTML = `<strong>Study Pages:</strong> ${scenario.studyPages.join(', ')}`;
    } else {
        studyPagesDiv.innerHTML = '';
    }
    
    const conceptsDiv = document.getElementById('relatedConcepts');
    if (scenario.relatedConcepts && scenario.relatedConcepts.length > 0) {
        conceptsDiv.innerHTML = `<strong>Related Concepts:</strong> ${scenario.relatedConcepts.join(', ')}`;
    } else {
        conceptsDiv.innerHTML = '';
    }
}

function navigateScenario(direction) {
    const newIndex = currentScenarioIndex + direction;
    if (newIndex >= 0 && newIndex < filteredScenarios.length) {
        currentScenarioIndex = newIndex;
        displayScenario();
    }
}

function filterScenarios() {
    const difficulty = document.getElementById('scenarioDifficultyFilter').value;
    
    filteredScenarios = scenarios.filter(s => {
        return difficulty === 'all' || s.difficulty === difficulty;
    });
    
    currentScenarioIndex = 0;
    displayScenario();
}

function updateScenarioStats() {
    const answered = filteredScenarios.filter(s => scenarioAnswers[s.id]).length;
    const correct = filteredScenarios.filter(s => scenarioAnswers[s.id] === s.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    document.getElementById('scenarioProgress').textContent = `${answered}/${filteredScenarios.length}`;
    document.getElementById('scenarioCorrectCount').textContent = correct;
    document.getElementById('scenarioScorePercentage').textContent = `${percentage}%`;
}

// Terms functionality
function displayTerms() {
    const grid = document.getElementById('termsGrid');
    grid.innerHTML = '';
    
    filteredTerms.forEach(term => {
        const termCard = document.createElement('div');
        termCard.className = 'term-card';
        termCard.innerHTML = `
            <h3>${term.term}</h3>
            <p>${term.definition}</p>
            <div class="term-meta">
                <span class="term-category">${term.category}</span>
                ${term.testRelevant ? '<span class="test-relevant">Test Relevant</span>' : ''}
            </div>
        `;
        grid.appendChild(termCard);
    });
}

function filterTerms() {
    const category = document.getElementById('termCategoryFilter').value;
    const searchText = document.getElementById('termSearch').value.toLowerCase();
    
    filteredTerms = terms.filter(term => {
        const categoryMatch = category === 'all' || term.category === category;
        const searchMatch = !searchText || 
            term.term.toLowerCase().includes(searchText) || 
            term.definition.toLowerCase().includes(searchText) ||
            (term.keywords && term.keywords.some(k => k.toLowerCase().includes(searchText)));
        return categoryMatch && searchMatch;
    });
    
    // Track category study for gamification
    if (category !== 'all') {
        gamification.onCategoryStudied(category);
    }
    
    displayTerms();
}

// Flashcard functionality
function updateFlashcards() {
    const category = document.getElementById('flashcardCategoryFilter').value;
    const mode = document.getElementById('flashcardMode').value;
    
    filteredTerms = terms.filter(term => {
        const categoryMatch = category === 'all' || term.category === category;
        const modeMatch = mode === 'all' || (mode === 'test-relevant' && term.testRelevant);
        return categoryMatch && modeMatch;
    });
    
    currentFlashcardIndex = 0;
    displayFlashcard();
}

function displayFlashcard() {
    if (filteredTerms.length === 0) return;
    
    const term = filteredTerms[currentFlashcardIndex];
    document.getElementById('flashcardTerm').textContent = term.term;
    document.getElementById('flashcardDefinition').textContent = term.definition;
    
    const keywordsDiv = document.getElementById('flashcardKeywords');
    if (term.keywords && term.keywords.length > 0) {
        keywordsDiv.innerHTML = `<strong>Keywords:</strong> ${term.keywords.join(', ')}`;
    } else {
        keywordsDiv.innerHTML = '';
    }
    
    document.getElementById('flashcardProgress').textContent = 
        `${currentFlashcardIndex + 1} / ${filteredTerms.length}`;
    
    // Reset flip state
    document.getElementById('flashcard').classList.remove('flipped');
}

function navigateFlashcard(direction) {
    const newIndex = currentFlashcardIndex + direction;
    if (newIndex >= 0 && newIndex < filteredTerms.length) {
        currentFlashcardIndex = newIndex;
        displayFlashcard();
        
        // Track category for gamification
        if (filteredTerms[currentFlashcardIndex]) {
            gamification.onCategoryStudied(filteredTerms[currentFlashcardIndex].category);
        }
    }
}

function shuffleFlashcards() {
    for (let i = filteredTerms.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredTerms[i], filteredTerms[j]] = [filteredTerms[j], filteredTerms[i]];
    }
    currentFlashcardIndex = 0;
    displayFlashcard();
}

// Progress management
function saveProgress() {
    localStorage.setItem('fcs_questionAnswers', JSON.stringify(questionAnswers));
    localStorage.setItem('fcs_scenarioAnswers', JSON.stringify(scenarioAnswers));
}

function loadProgress() {
    const savedQuestions = localStorage.getItem('fcs_questionAnswers');
    const savedScenarios = localStorage.getItem('fcs_scenarioAnswers');
    
    if (savedQuestions) {
        questionAnswers = JSON.parse(savedQuestions);
    }
    if (savedScenarios) {
        scenarioAnswers = JSON.parse(savedScenarios);
    }
    
    updateQuestionStats();
    updateScenarioStats();
}

function resetQuestions() {
    if (confirm('Are you sure you want to reset all question progress?')) {
        questionAnswers = {};
        saveProgress();
        displayQuestion();
        updateQuestionStats();
    }
}

function resetScenarios() {
    if (confirm('Are you sure you want to reset all scenario progress?')) {
        scenarioAnswers = {};
        saveProgress();
        displayScenario();
        updateScenarioStats();
    }
}

// Gamification dashboard rendering
function renderGamificationDashboard() {
    const dashboardContainer = document.getElementById('gamificationDashboard');
    dashboardContainer.innerHTML = gamification.renderDashboard();
    
    // Add event listeners for gamification settings
    const toggleBtn = document.getElementById('toggleGamification');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            gamification.data.settings.enabled = !gamification.data.settings.enabled;
            gamification.save();
            renderGamificationDashboard();
        });
    }
    
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            gamification.data.settings.soundEnabled = e.target.checked;
            gamification.save();
        });
    }
    
    const animationToggle = document.getElementById('animationToggle');
    if (animationToggle) {
        animationToggle.addEventListener('change', (e) => {
            gamification.data.settings.animationsEnabled = e.target.checked;
            gamification.save();
        });
    }
}