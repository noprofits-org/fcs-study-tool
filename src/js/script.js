// FCS Study Tool JavaScript
let questions = [];
let scenarios = [];
let terms = [];
let talkingPoints = [];
let currentQuestionIndex = 0;
let currentScenarioIndex = 0;
let currentFlashcardIndex = 0;
let currentTalkingPointIndex = 0;
let questionAnswers = {};
let scenarioAnswers = {};
let talkingPointAnswers = {};
let filteredQuestions = [];
let filteredScenarios = [];
let filteredTerms = [];
let filteredTalkingPoints = [];

// Resources module data (Section 6: Program Approach and Resources)
let resourceQuestions = [];
let resourceTerms = [];
let resourceScenarios = [];
let resourceTalkingPoints = [];
let currentResourceQuestionIndex = 0;
let currentResourceScenarioIndex = 0;
let currentResourceTalkingPointIndex = 0;
let resourceQuestionAnswers = {};
let resourceScenarioAnswers = {};
let resourceTalkingPointAnswers = {};
let filteredResourceQuestions = [];
let filteredResourceTerms = [];
let filteredResourceScenarios = [];
let filteredResourceTalkingPoints = [];

// Gamification tracking to prevent XP exploits
let reviewedFlashcards = new Set();
let questionMilestones = new Set();
let talkingPointMilestones = new Set();
let resourceQuestionMilestones = new Set();
let resourceTalkingPointMilestones = new Set();

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
        const [questionsData, scenariosData, termsData, talkingPointsData, resourcesData] = await Promise.all([
            fetch('src/data/questions.json').then(r => r.json()),
            fetch('src/data/scenarios.json').then(r => r.json()),
            fetch('src/data/terms.json').then(r => r.json()),
            fetch('src/data/talking-points.json').then(r => r.json()),
            fetch('src/data/resources.json').then(r => r.json())
        ]);

        questions = questionsData.questions;
        scenarios = scenariosData.scenarios;
        terms = termsData.terms;
        talkingPoints = talkingPointsData.talkingPoints;

        // Load resources module data
        resourceQuestions = resourcesData.questions;
        resourceTerms = resourcesData.terms;
        resourceScenarios = resourcesData.scenarios;
        resourceTalkingPoints = resourcesData.talkingPoints;

        filteredQuestions = [...questions];
        filteredScenarios = [...scenarios];
        filteredTerms = [...terms];
        filteredTalkingPoints = [...talkingPoints];

        // Initialize filtered resources
        filteredResourceQuestions = [...resourceQuestions];
        filteredResourceTerms = [...resourceTerms];
        filteredResourceScenarios = [...resourceScenarios];
        filteredResourceTalkingPoints = [...resourceTalkingPoints];

        displayQuestion();
        displayScenario();
        displayTerms();
        updateFlashcards();
        displayTalkingPoint();
        initializeTalkingPointsFilters();

        // Initialize resources module
        initializeResourcesModule();
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
    document.getElementById('flashcard').addEventListener('click', function () {
        const wasFlipped = this.classList.contains('flipped');
        this.classList.toggle('flipped');

        // Track flashcard review for gamification
        // Award XP when flipping TO answer side (revealing the answer)
        // Only award once per unique flashcard
        if (!wasFlipped && this.classList.contains('flipped')) {
            const currentTerm = filteredTerms[currentFlashcardIndex];
            // Use term + category as unique identifier (stable across shuffles and filters)
            const flashcardId = currentTerm ? `${currentTerm.term}|${currentTerm.category}` : currentFlashcardIndex;
            if (!reviewedFlashcards.has(flashcardId)) {
                reviewedFlashcards.add(flashcardId);
                gamification.onFlashcardReviewed();
            }
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

    // Talking Points navigation
    document.getElementById('prevTalkingPoint').addEventListener('click', () => navigateTalkingPoint(-1));
    document.getElementById('nextTalkingPoint').addEventListener('click', () => navigateTalkingPoint(1));
    document.getElementById('trueBtn').addEventListener('click', () => selectTalkingPointAnswer(true));
    document.getElementById('falseBtn').addEventListener('click', () => selectTalkingPointAnswer(false));
    document.getElementById('talkingPointsCategoryFilter').addEventListener('change', filterTalkingPoints);
    document.getElementById('resetTalkingPoints').addEventListener('click', resetTalkingPoints);
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

    // Track for gamification based on TOTAL unique questions answered (not filtered)
    const totalAnswered = Object.keys(questionAnswers).length;
    const totalCorrect = questions.filter(q => questionAnswers[q.id] === q.correct).length;

    // Check for milestone rewards (every 10 questions) - only award once per milestone
    const milestone = Math.floor(totalAnswered / 10) * 10;
    if (milestone > 0 && totalAnswered % 10 === 0 && !questionMilestones.has(milestone)) {
        questionMilestones.add(milestone);
        gamification.onPracticeTestCompleted(totalCorrect, totalAnswered);
    }

    // Check for full test completion (all questions answered) - only award once
    if (totalAnswered === questions.length && !questionMilestones.has('fullTest')) {
        questionMilestones.add('fullTest');
        gamification.onFullTestCompleted(totalCorrect, questions.length);
    }

    // Update category score if filtering by category
    const category = document.getElementById('categoryFilter').value;
    if (category !== 'all') {
        const categoryAnswered = filteredQuestions.filter(q => questionAnswers[q.id]).length;
        const categoryCorrect = filteredQuestions.filter(q => questionAnswers[q.id] === q.correct).length;
        if (categoryAnswered > 0) {
            gamification.lastCategoryScore = Math.round((categoryCorrect / categoryAnswered) * 100);
        }
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
    // Only award XP if this is the first time answering this scenario
    const isFirstAnswer = scenarioAnswers[scenario.id] === undefined;

    scenarioAnswers[scenario.id] = key;
    saveProgress();

    // Track for gamification - only on first answer
    if (isFirstAnswer) {
        gamification.onScenarioCompleted();
    }

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
    localStorage.setItem('fcs_talkingPointAnswers', JSON.stringify(talkingPointAnswers));
    // Resources module progress
    localStorage.setItem('fcs_resourceQuestionAnswers', JSON.stringify(resourceQuestionAnswers));
    localStorage.setItem('fcs_resourceScenarioAnswers', JSON.stringify(resourceScenarioAnswers));
    localStorage.setItem('fcs_resourceTalkingPointAnswers', JSON.stringify(resourceTalkingPointAnswers));
}

function loadProgress() {
    const savedQuestions = localStorage.getItem('fcs_questionAnswers');
    const savedScenarios = localStorage.getItem('fcs_scenarioAnswers');
    const savedTalkingPoints = localStorage.getItem('fcs_talkingPointAnswers');

    if (savedQuestions) {
        questionAnswers = JSON.parse(savedQuestions);
        // Rebuild milestone trackers based on loaded progress
        const totalAnswered = Object.keys(questionAnswers).length;
        for (let i = 10; i <= Math.floor(totalAnswered / 10) * 10; i += 10) {
            questionMilestones.add(i);
        }
        if (totalAnswered === questions.length) {
            questionMilestones.add('fullTest');
        }
    }
    if (savedScenarios) {
        scenarioAnswers = JSON.parse(savedScenarios);
    }
    if (savedTalkingPoints) {
        talkingPointAnswers = JSON.parse(savedTalkingPoints);
        // Rebuild milestone trackers based on loaded progress
        const totalAnswered = Object.keys(talkingPointAnswers).length;
        for (let i = 10; i <= Math.floor(totalAnswered / 10) * 10; i += 10) {
            talkingPointMilestones.add(i);
        }
    }

    // Load resources module progress
    const savedResourceQuestions = localStorage.getItem('fcs_resourceQuestionAnswers');
    const savedResourceScenarios = localStorage.getItem('fcs_resourceScenarioAnswers');
    const savedResourceTalkingPoints = localStorage.getItem('fcs_resourceTalkingPointAnswers');

    if (savedResourceQuestions) {
        resourceQuestionAnswers = JSON.parse(savedResourceQuestions);
        const totalAnswered = Object.keys(resourceQuestionAnswers).length;
        for (let i = 10; i <= Math.floor(totalAnswered / 10) * 10; i += 10) {
            resourceQuestionMilestones.add(i);
        }
    }
    if (savedResourceScenarios) {
        resourceScenarioAnswers = JSON.parse(savedResourceScenarios);
    }
    if (savedResourceTalkingPoints) {
        resourceTalkingPointAnswers = JSON.parse(savedResourceTalkingPoints);
        const totalAnswered = Object.keys(resourceTalkingPointAnswers).length;
        for (let i = 10; i <= Math.floor(totalAnswered / 10) * 10; i += 10) {
            resourceTalkingPointMilestones.add(i);
        }
    }

    updateQuestionStats();
    updateScenarioStats();
    updateTalkingPointsStats();
}

function resetQuestions() {
    if (confirm('Are you sure you want to reset all question progress?')) {
        questionAnswers = {};
        questionMilestones.clear();
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

// Talking Points functionality
function initializeTalkingPointsFilters() {
    const categories = [...new Set(talkingPoints.map(tp => tp.category))].sort();
    const categorySelect = document.getElementById('talkingPointsCategoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

function displayTalkingPoint() {
    if (filteredTalkingPoints.length === 0) return;

    const talkingPoint = filteredTalkingPoints[currentTalkingPointIndex];
    document.getElementById('talkingPointsNumber').textContent = `Statement ${currentTalkingPointIndex + 1} of ${filteredTalkingPoints.length}`;
    document.getElementById('talkingPointStatement').textContent = talkingPoint.statement;

    // Enable/disable buttons based on whether answered
    const answerId = talkingPoint.id;
    const isAnswered = talkingPointAnswers[answerId] !== undefined;

    document.getElementById('trueBtn').disabled = isAnswered;
    document.getElementById('falseBtn').disabled = isAnswered;

    // Show answer state if already answered
    if (isAnswered) {
        const userAnswer = talkingPointAnswers[answerId];
        if (userAnswer === true) {
            document.getElementById('trueBtn').classList.add('selected');
            document.getElementById('trueBtn').classList.add(userAnswer === talkingPoint.correct ? 'correct' : 'incorrect');
        } else {
            document.getElementById('falseBtn').classList.add('selected');
            document.getElementById('falseBtn').classList.add(userAnswer === talkingPoint.correct ? 'correct' : 'incorrect');
        }
        showTalkingPointExplanation(talkingPoint);
    } else {
        document.getElementById('trueBtn').classList.remove('selected', 'correct', 'incorrect');
        document.getElementById('falseBtn').classList.remove('selected', 'correct', 'incorrect');
        document.getElementById('talkingPointsExplanation').style.display = 'none';
    }

    updateTalkingPointsStats();
}

function selectTalkingPointAnswer(answer) {
    const talkingPoint = filteredTalkingPoints[currentTalkingPointIndex];
    talkingPointAnswers[talkingPoint.id] = answer;
    saveProgress();

    // Track for gamification based on TOTAL unique talking points answered (not filtered)
    const totalAnswered = Object.keys(talkingPointAnswers).length;
    const totalCorrect = talkingPoints.filter(tp => talkingPointAnswers[tp.id] === tp.correct).length;

    // Check for milestone rewards (every 10 talking points) - only award once per milestone
    const milestone = Math.floor(totalAnswered / 10) * 10;
    if (milestone > 0 && totalAnswered % 10 === 0 && !talkingPointMilestones.has(milestone)) {
        talkingPointMilestones.add(milestone);
        gamification.onPracticeTestCompleted(totalCorrect, totalAnswered);
    }

    displayTalkingPoint();
}

function showTalkingPointExplanation(talkingPoint) {
    const container = document.getElementById('talkingPointsExplanation');
    container.style.display = 'block';
    document.getElementById('talkingPointsExplanationText').textContent = talkingPoint.explanation;
    document.getElementById('talkingPointsSource').textContent = `Source: ${talkingPoint.sourceSection}`;
}

function navigateTalkingPoint(direction) {
    const newIndex = currentTalkingPointIndex + direction;
    if (newIndex >= 0 && newIndex < filteredTalkingPoints.length) {
        currentTalkingPointIndex = newIndex;
        displayTalkingPoint();
    }
}

function filterTalkingPoints() {
    const category = document.getElementById('talkingPointsCategoryFilter').value;

    filteredTalkingPoints = talkingPoints.filter(tp => {
        return category === 'all' || tp.category === category;
    });

    currentTalkingPointIndex = 0;
    displayTalkingPoint();
}

function updateTalkingPointsStats() {
    const answered = filteredTalkingPoints.filter(tp => talkingPointAnswers[tp.id] !== undefined).length;
    const correct = filteredTalkingPoints.filter(tp => talkingPointAnswers[tp.id] === tp.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('talkingPointsProgress').textContent = `${answered}/${filteredTalkingPoints.length}`;
    document.getElementById('talkingPointsCorrectCount').textContent = correct;
    document.getElementById('talkingPointsScorePercentage').textContent = `${percentage}%`;
}

function resetTalkingPoints() {
    if (confirm('Are you sure you want to reset all talking points progress?')) {
        talkingPointAnswers = {};
        talkingPointMilestones.clear();
        saveProgress();
        displayTalkingPoint();
        updateTalkingPointsStats();
    }
}

// ========================================
// RESOURCES MODULE (Section 6: Program Approach & Resources)
// ========================================

function initializeResourcesModule() {
    // Initialize filters
    initializeResourceFilters();

    // Add event listeners for resource tabs
    document.querySelectorAll('.resource-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchResourceTab(tabId);
            document.querySelectorAll('.resource-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Resource Questions navigation
    document.getElementById('prevResourceQuestion').addEventListener('click', () => navigateResourceQuestion(-1));
    document.getElementById('nextResourceQuestion').addEventListener('click', () => navigateResourceQuestion(1));
    document.getElementById('resetResourceQuestions').addEventListener('click', resetResourceQuestions);
    document.getElementById('resourceCategoryFilter').addEventListener('change', filterResourceQuestions);

    // Resource Terms
    document.getElementById('resourceTermCategoryFilter').addEventListener('change', filterResourceTerms);
    document.getElementById('resourceTermSearch').addEventListener('input', filterResourceTerms);

    // Resource Scenarios
    document.getElementById('prevResourceScenario').addEventListener('click', () => navigateResourceScenario(-1));
    document.getElementById('nextResourceScenario').addEventListener('click', () => navigateResourceScenario(1));
    document.getElementById('resetResourceScenarios').addEventListener('click', resetResourceScenarios);
    document.getElementById('resourceScenarioDifficultyFilter').addEventListener('change', filterResourceScenarios);

    // Resource Talking Points
    document.getElementById('prevResourceTalkingPoint').addEventListener('click', () => navigateResourceTalkingPoint(-1));
    document.getElementById('nextResourceTalkingPoint').addEventListener('click', () => navigateResourceTalkingPoint(1));
    document.getElementById('resetResourceTalkingPoints').addEventListener('click', resetResourceTalkingPoints);
    document.getElementById('resourceTrueBtn').addEventListener('click', () => selectResourceTalkingPointAnswer(true));
    document.getElementById('resourceFalseBtn').addEventListener('click', () => selectResourceTalkingPointAnswer(false));
    document.getElementById('resourceTalkingPointsCategoryFilter').addEventListener('change', filterResourceTalkingPoints);

    // Display initial content
    displayResourceQuestion();
    displayResourceTerms();
    displayResourceScenario();
    displayResourceTalkingPoint();
}

function initializeResourceFilters() {
    // Question categories
    const questionCategories = [...new Set(resourceQuestions.map(q => q.category))].sort();
    const categorySelect = document.getElementById('resourceCategoryFilter');
    questionCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Term categories
    const termCategories = [...new Set(resourceTerms.map(t => t.category))].sort();
    const termCategorySelect = document.getElementById('resourceTermCategoryFilter');
    termCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        termCategorySelect.appendChild(option);
    });

    // Talking points categories
    const tpCategories = [...new Set(resourceTalkingPoints.map(tp => tp.category))].sort();
    const tpCategorySelect = document.getElementById('resourceTalkingPointsCategoryFilter');
    tpCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        tpCategorySelect.appendChild(option);
    });
}

function switchResourceTab(tabId) {
    document.querySelectorAll('.resource-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// Resource Questions
function displayResourceQuestion() {
    if (filteredResourceQuestions.length === 0) return;

    const question = filteredResourceQuestions[currentResourceQuestionIndex];
    document.getElementById('resourceQuestionNumber').textContent = `Question ${currentResourceQuestionIndex + 1} of ${filteredResourceQuestions.length}`;
    document.getElementById('resourceQuestionDifficulty').textContent = question.difficulty;
    document.getElementById('resourceQuestionDifficulty').className = `difficulty-badge ${question.difficulty.toLowerCase()}`;
    document.getElementById('resourceQuestionText').textContent = question.text;

    const optionsContainer = document.getElementById('resourceOptionsContainer');
    optionsContainer.innerHTML = '';

    Object.entries(question.options).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `<span class="option-key">${key}:</span> ${value}`;
        optionDiv.dataset.key = key;

        if (resourceQuestionAnswers[question.id]) {
            if (key === question.correct) {
                optionDiv.classList.add('correct');
            }
            if (key === resourceQuestionAnswers[question.id] && key !== question.correct) {
                optionDiv.classList.add('incorrect');
            }
            if (key === resourceQuestionAnswers[question.id]) {
                optionDiv.classList.add('selected');
            }
        } else {
            optionDiv.addEventListener('click', () => selectResourceAnswer(key, question));
        }

        optionsContainer.appendChild(optionDiv);
    });

    if (resourceQuestionAnswers[question.id]) {
        showResourceExplanation(question);
    } else {
        document.getElementById('resourceExplanationContainer').style.display = 'none';
    }

    updateResourceQuestionStats();
}

function selectResourceAnswer(key, question) {
    resourceQuestionAnswers[question.id] = key;
    saveProgress();

    // Track for gamification
    const totalAnswered = Object.keys(resourceQuestionAnswers).length;
    const totalCorrect = resourceQuestions.filter(q => resourceQuestionAnswers[q.id] === q.correct).length;

    const milestone = Math.floor(totalAnswered / 10) * 10;
    if (milestone > 0 && totalAnswered % 10 === 0 && !resourceQuestionMilestones.has(milestone)) {
        resourceQuestionMilestones.add(milestone);
        gamification.onPracticeTestCompleted(totalCorrect, totalAnswered);
    }

    displayResourceQuestion();
}

function showResourceExplanation(question) {
    const container = document.getElementById('resourceExplanationContainer');
    container.style.display = 'block';
    document.getElementById('resourceExplanationText').textContent = question.explanation;

    const studyPagesDiv = document.getElementById('resourceStudyPages');
    if (question.studyPages && question.studyPages.length > 0) {
        studyPagesDiv.innerHTML = `<strong>Study Pages:</strong> ${question.studyPages.join(', ')}`;
    } else {
        studyPagesDiv.innerHTML = '';
    }
}

function navigateResourceQuestion(direction) {
    const newIndex = currentResourceQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < filteredResourceQuestions.length) {
        currentResourceQuestionIndex = newIndex;
        displayResourceQuestion();
    }
}

function filterResourceQuestions() {
    const category = document.getElementById('resourceCategoryFilter').value;

    filteredResourceQuestions = resourceQuestions.filter(q => {
        return category === 'all' || q.category === category;
    });

    currentResourceQuestionIndex = 0;
    displayResourceQuestion();
}

function updateResourceQuestionStats() {
    const answered = filteredResourceQuestions.filter(q => resourceQuestionAnswers[q.id]).length;
    const correct = filteredResourceQuestions.filter(q => resourceQuestionAnswers[q.id] === q.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('resourceQuestionProgress').textContent = `${answered}/${filteredResourceQuestions.length}`;
    document.getElementById('resourceCorrectCount').textContent = correct;
    document.getElementById('resourceScorePercentage').textContent = `${percentage}%`;
}

function resetResourceQuestions() {
    if (confirm('Are you sure you want to reset all resource questions progress?')) {
        resourceQuestionAnswers = {};
        resourceQuestionMilestones.clear();
        saveProgress();
        displayResourceQuestion();
        updateResourceQuestionStats();
    }
}

// Resource Terms
function displayResourceTerms() {
    const grid = document.getElementById('resourceTermsGrid');
    grid.innerHTML = '';

    filteredResourceTerms.forEach(term => {
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

function filterResourceTerms() {
    const category = document.getElementById('resourceTermCategoryFilter').value;
    const searchText = document.getElementById('resourceTermSearch').value.toLowerCase();

    filteredResourceTerms = resourceTerms.filter(term => {
        const categoryMatch = category === 'all' || term.category === category;
        const searchMatch = !searchText ||
            term.term.toLowerCase().includes(searchText) ||
            term.definition.toLowerCase().includes(searchText) ||
            (term.keywords && term.keywords.some(k => k.toLowerCase().includes(searchText)));
        return categoryMatch && searchMatch;
    });

    displayResourceTerms();
}

// Resource Scenarios
function displayResourceScenario() {
    if (filteredResourceScenarios.length === 0) return;

    const scenario = filteredResourceScenarios[currentResourceScenarioIndex];
    document.getElementById('resourceScenarioTitle').textContent = scenario.title;
    document.getElementById('resourceScenarioDifficulty').textContent = scenario.difficulty;
    document.getElementById('resourceScenarioDifficulty').className = `difficulty-badge ${scenario.difficulty.toLowerCase()}`;
    document.getElementById('resourceScenarioDescription').textContent = scenario.description;
    document.getElementById('resourceScenarioQuestion').textContent = scenario.question;

    const optionsContainer = document.getElementById('resourceScenarioOptionsContainer');
    optionsContainer.innerHTML = '';

    Object.entries(scenario.options).forEach(([key, value]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = `<span class="option-key">${key}:</span> ${value}`;
        optionDiv.dataset.key = key;

        if (resourceScenarioAnswers[scenario.id]) {
            if (key === scenario.correct) {
                optionDiv.classList.add('correct');
            }
            if (key === resourceScenarioAnswers[scenario.id] && key !== scenario.correct) {
                optionDiv.classList.add('incorrect');
            }
            if (key === resourceScenarioAnswers[scenario.id]) {
                optionDiv.classList.add('selected');
            }
        } else {
            optionDiv.addEventListener('click', () => selectResourceScenarioAnswer(key, scenario));
        }

        optionsContainer.appendChild(optionDiv);
    });

    if (resourceScenarioAnswers[scenario.id]) {
        showResourceScenarioExplanation(scenario);
    } else {
        document.getElementById('resourceScenarioExplanationContainer').style.display = 'none';
    }

    updateResourceScenarioStats();
}

function selectResourceScenarioAnswer(key, scenario) {
    const isFirstAnswer = resourceScenarioAnswers[scenario.id] === undefined;

    resourceScenarioAnswers[scenario.id] = key;
    saveProgress();

    if (isFirstAnswer) {
        gamification.onScenarioCompleted();
    }

    displayResourceScenario();
}

function showResourceScenarioExplanation(scenario) {
    const container = document.getElementById('resourceScenarioExplanationContainer');
    container.style.display = 'block';
    document.getElementById('resourceScenarioExplanationText').textContent = scenario.explanation;

    const studyPagesDiv = document.getElementById('resourceScenarioStudyPages');
    if (scenario.studyPages && scenario.studyPages.length > 0) {
        studyPagesDiv.innerHTML = `<strong>Study Pages:</strong> ${scenario.studyPages.join(', ')}`;
    } else {
        studyPagesDiv.innerHTML = '';
    }

    const conceptsDiv = document.getElementById('resourceRelatedConcepts');
    if (scenario.relatedConcepts && scenario.relatedConcepts.length > 0) {
        conceptsDiv.innerHTML = `<strong>Related Concepts:</strong> ${scenario.relatedConcepts.join(', ')}`;
    } else {
        conceptsDiv.innerHTML = '';
    }
}

function navigateResourceScenario(direction) {
    const newIndex = currentResourceScenarioIndex + direction;
    if (newIndex >= 0 && newIndex < filteredResourceScenarios.length) {
        currentResourceScenarioIndex = newIndex;
        displayResourceScenario();
    }
}

function filterResourceScenarios() {
    const difficulty = document.getElementById('resourceScenarioDifficultyFilter').value;

    filteredResourceScenarios = resourceScenarios.filter(s => {
        return difficulty === 'all' || s.difficulty === difficulty;
    });

    currentResourceScenarioIndex = 0;
    displayResourceScenario();
}

function updateResourceScenarioStats() {
    const answered = filteredResourceScenarios.filter(s => resourceScenarioAnswers[s.id]).length;
    const correct = filteredResourceScenarios.filter(s => resourceScenarioAnswers[s.id] === s.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('resourceScenarioProgress').textContent = `${answered}/${filteredResourceScenarios.length}`;
    document.getElementById('resourceScenarioCorrectCount').textContent = correct;
    document.getElementById('resourceScenarioScorePercentage').textContent = `${percentage}%`;
}

function resetResourceScenarios() {
    if (confirm('Are you sure you want to reset all resource scenarios progress?')) {
        resourceScenarioAnswers = {};
        saveProgress();
        displayResourceScenario();
        updateResourceScenarioStats();
    }
}

// Resource Talking Points
function displayResourceTalkingPoint() {
    if (filteredResourceTalkingPoints.length === 0) return;

    const tp = filteredResourceTalkingPoints[currentResourceTalkingPointIndex];
    document.getElementById('resourceTalkingPointsNumber').textContent = `Statement ${currentResourceTalkingPointIndex + 1} of ${filteredResourceTalkingPoints.length}`;
    document.getElementById('resourceTalkingPointStatement').textContent = tp.statement;

    const isAnswered = resourceTalkingPointAnswers[tp.id] !== undefined;

    document.getElementById('resourceTrueBtn').disabled = isAnswered;
    document.getElementById('resourceFalseBtn').disabled = isAnswered;

    if (isAnswered) {
        const userAnswer = resourceTalkingPointAnswers[tp.id];
        if (userAnswer === true) {
            document.getElementById('resourceTrueBtn').classList.add('selected');
            document.getElementById('resourceTrueBtn').classList.add(userAnswer === tp.correct ? 'correct' : 'incorrect');
        } else {
            document.getElementById('resourceFalseBtn').classList.add('selected');
            document.getElementById('resourceFalseBtn').classList.add(userAnswer === tp.correct ? 'correct' : 'incorrect');
        }
        showResourceTalkingPointExplanation(tp);
    } else {
        document.getElementById('resourceTrueBtn').classList.remove('selected', 'correct', 'incorrect');
        document.getElementById('resourceFalseBtn').classList.remove('selected', 'correct', 'incorrect');
        document.getElementById('resourceTalkingPointsExplanation').style.display = 'none';
    }

    updateResourceTalkingPointsStats();
}

function selectResourceTalkingPointAnswer(answer) {
    const tp = filteredResourceTalkingPoints[currentResourceTalkingPointIndex];
    resourceTalkingPointAnswers[tp.id] = answer;
    saveProgress();

    const totalAnswered = Object.keys(resourceTalkingPointAnswers).length;
    const totalCorrect = resourceTalkingPoints.filter(tp => resourceTalkingPointAnswers[tp.id] === tp.correct).length;

    const milestone = Math.floor(totalAnswered / 10) * 10;
    if (milestone > 0 && totalAnswered % 10 === 0 && !resourceTalkingPointMilestones.has(milestone)) {
        resourceTalkingPointMilestones.add(milestone);
        gamification.onPracticeTestCompleted(totalCorrect, totalAnswered);
    }

    displayResourceTalkingPoint();
}

function showResourceTalkingPointExplanation(tp) {
    const container = document.getElementById('resourceTalkingPointsExplanation');
    container.style.display = 'block';
    document.getElementById('resourceTalkingPointsExplanationText').textContent = tp.explanation;
    document.getElementById('resourceTalkingPointsSource').textContent = `Source: ${tp.sourceSection}`;
}

function navigateResourceTalkingPoint(direction) {
    const newIndex = currentResourceTalkingPointIndex + direction;
    if (newIndex >= 0 && newIndex < filteredResourceTalkingPoints.length) {
        currentResourceTalkingPointIndex = newIndex;
        displayResourceTalkingPoint();
    }
}

function filterResourceTalkingPoints() {
    const category = document.getElementById('resourceTalkingPointsCategoryFilter').value;

    filteredResourceTalkingPoints = resourceTalkingPoints.filter(tp => {
        return category === 'all' || tp.category === category;
    });

    currentResourceTalkingPointIndex = 0;
    displayResourceTalkingPoint();
}

function updateResourceTalkingPointsStats() {
    const answered = filteredResourceTalkingPoints.filter(tp => resourceTalkingPointAnswers[tp.id] !== undefined).length;
    const correct = filteredResourceTalkingPoints.filter(tp => resourceTalkingPointAnswers[tp.id] === tp.correct).length;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('resourceTalkingPointsProgress').textContent = `${answered}/${filteredResourceTalkingPoints.length}`;
    document.getElementById('resourceTalkingPointsCorrectCount').textContent = correct;
    document.getElementById('resourceTalkingPointsScorePercentage').textContent = `${percentage}%`;
}

function resetResourceTalkingPoints() {
    if (confirm('Are you sure you want to reset all resource talking points progress?')) {
        resourceTalkingPointAnswers = {};
        resourceTalkingPointMilestones.clear();
        saveProgress();
        displayResourceTalkingPoint();
        updateResourceTalkingPointsStats();
    }
}