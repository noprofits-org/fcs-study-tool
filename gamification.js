// Gamification System for FCS Study Tool

class GamificationSystem {
    constructor() {
        this.data = {
            totalXP: 0,
            currentLevel: 1,
            achievements: [],
            dailyStreak: 0,
            lastStudyDate: null,
            challengesCompleted: [],
            dailyChallenges: [],
            settings: {
                enabled: true,
                soundEnabled: true,
                animationsEnabled: true
            },
            statistics: {
                flashcardsReviewed: 0,
                practiceTestsCompleted: 0,
                fullTestsCompleted: 0,
                scenariosCompleted: 0,
                perfectScores: 0,
                totalStudyTime: 0,
                categoriesStudied: {}
            }
        };
        
        this.levels = [
            { level: 1, minXP: 0, maxXP: 100, title: "Novice Assessor" },
            { level: 2, minXP: 101, maxXP: 300, title: "Apprentice Assessor" },
            { level: 3, minXP: 301, maxXP: 600, title: "Skilled Assessor" },
            { level: 4, minXP: 601, maxXP: 1000, title: "Expert Assessor" },
            { level: 5, minXP: 1001, maxXP: 1500, title: "Master Assessor" },
            { level: 6, minXP: 1501, maxXP: 999999, title: "CE Champion" }
        ];
        
        this.achievements = {
            firstSteps: {
                id: 'firstSteps',
                name: 'First Steps',
                description: 'Complete first flashcard review',
                icon: '👶',
                condition: () => this.data.statistics.flashcardsReviewed >= 1
            },
            quickLearner: {
                id: 'quickLearner',
                name: 'Quick Learner',
                description: 'Complete 10 flashcards in one session',
                icon: '🏃',
                condition: () => this.sessionStats.flashcardsReviewed >= 10
            },
            memoryMaster: {
                id: 'memoryMaster',
                name: 'Memory Master',
                description: 'Review all flashcards in one day',
                icon: '🧠',
                condition: () => this.dailyStats.allFlashcardsReviewed
            },
            testTaker: {
                id: 'testTaker',
                name: 'Test Taker',
                description: 'Complete first practice test',
                icon: '📝',
                condition: () => this.data.statistics.practiceTestsCompleted >= 1
            },
            highScorer: {
                id: 'highScorer',
                name: 'High Scorer',
                description: 'Score 90%+ on any test',
                icon: '🎯',
                condition: () => this.lastTestScore >= 90
            },
            perfectScore: {
                id: 'perfectScore',
                name: 'Perfect Score',
                description: 'Achieve 100% on any test',
                icon: '💯',
                condition: () => this.lastTestScore === 100
            },
            consistentStudent: {
                id: 'consistentStudent',
                name: 'Consistent Student',
                description: '3-day study streak',
                icon: '📚',
                condition: () => this.data.dailyStreak >= 3
            },
            dedicatedLearner: {
                id: 'dedicatedLearner',
                name: 'Dedicated Learner',
                description: '7-day study streak',
                icon: '🔥',
                condition: () => this.data.dailyStreak >= 7
            },
            studyWarrior: {
                id: 'studyWarrior',
                name: 'Study Warrior',
                description: '14-day study streak',
                icon: '⚔️',
                condition: () => this.data.dailyStreak >= 14
            },
            ceExpert: {
                id: 'ceExpert',
                name: 'CE Expert',
                description: '30-day study streak',
                icon: '👑',
                condition: () => this.data.dailyStreak >= 30
            },
            categorySpecialist: {
                id: 'categorySpecialist',
                name: 'Category Specialist',
                description: 'Score 95%+ in a specific category',
                icon: '🏆',
                condition: () => this.lastCategoryScore >= 95
            },
            nightOwl: {
                id: 'nightOwl',
                name: 'Night Owl',
                description: 'Study after 10 PM',
                icon: '🦉',
                condition: () => new Date().getHours() >= 22
            },
            earlyBird: {
                id: 'earlyBird',
                name: 'Early Bird',
                description: 'Study before 7 AM',
                icon: '🐦',
                condition: () => new Date().getHours() < 7
            },
            speedReader: {
                id: 'speedReader',
                name: 'Speed Reader',
                description: 'Complete 50 flashcards in under 10 minutes',
                icon: '⚡',
                condition: () => this.sessionStats.flashcardsReviewed >= 50 && this.sessionStats.duration < 600000
            },
            scenarioMaster: {
                id: 'scenarioMaster',
                name: 'Scenario Master',
                description: 'Complete all scenario practices',
                icon: '🎭',
                condition: () => this.allScenariosCompleted
            }
        };
        
        this.dailyChallengeTemplates = [
            { id: 'review20', description: 'Review 20 flashcards', xp: 50, check: () => this.dailyStats.flashcardsReviewed >= 20 },
            { id: 'score80', description: 'Score 80%+ on a practice test', xp: 50, check: () => this.dailyStats.highScore >= 80 },
            { id: 'studyEligibility', description: 'Study all Eligibility category terms', xp: 50, check: () => this.dailyStats.categoriesStudied.includes('Eligibility') },
            { id: 'complete3Scenarios', description: 'Complete 3 scenario practices', xp: 50, check: () => this.dailyStats.scenariosCompleted >= 3 },
            { id: 'perfectCategory', description: 'Achieve a perfect score on any category practice', xp: 50, check: () => this.dailyStats.perfectCategoryScore },
            { id: 'study30min', description: 'Study for 30 minutes', xp: 50, check: () => this.dailyStats.studyTime >= 1800000 },
            { id: 'reviewAllCategories', description: 'Review terms from all categories', xp: 50, check: () => this.dailyStats.allCategoriesReviewed },
            { id: 'complete5Tests', description: 'Complete 5 practice tests', xp: 50, check: () => this.dailyStats.testsCompleted >= 5 }
        ];
        
        this.sessionStats = {
            flashcardsReviewed: 0,
            duration: 0,
            startTime: Date.now()
        };
        
        this.dailyStats = {
            flashcardsReviewed: 0,
            testsCompleted: 0,
            scenariosCompleted: 0,
            highScore: 0,
            perfectCategoryScore: false,
            categoriesStudied: [],
            allFlashcardsReviewed: false,
            allCategoriesReviewed: false,
            studyTime: 0
        };
        
        this.lastTestScore = 0;
        this.lastCategoryScore = 0;
        this.allScenariosCompleted = false;
        
        // Track session for speed reader achievement
        this.sessionStartTime = Date.now();
        this.flashcardSessionCount = 0;
        
        this.load();
        this.checkDailyReset();
        this.updateStreak();
    }
    
    load() {
        const saved = localStorage.getItem('fcs_gamification');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.data = { ...this.data, ...parsed };
        }
    }
    
    save() {
        localStorage.setItem('fcs_gamification', JSON.stringify(this.data));
    }
    
    checkDailyReset() {
        const today = new Date().toDateString();
        const lastDate = this.data.lastStudyDate ? new Date(this.data.lastStudyDate).toDateString() : null;
        
        if (today !== lastDate) {
            this.dailyStats = {
                flashcardsReviewed: 0,
                testsCompleted: 0,
                scenariosCompleted: 0,
                highScore: 0,
                perfectCategoryScore: false,
                categoriesStudied: [],
                allFlashcardsReviewed: false,
                allCategoriesReviewed: false,
                studyTime: 0
            };
            this.generateDailyChallenges();
        }
    }
    
    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.data.lastStudyDate ? new Date(this.data.lastStudyDate).toDateString() : null;
        
        let dailyLoginAwarded = false;
        
        if (!lastDate) {
            this.data.dailyStreak = 1;
            this.awardXP(10, 'Daily Login');
            dailyLoginAwarded = true;
        } else if (today === lastDate) {
            // Same day, no change
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate === yesterday.toDateString()) {
                this.data.dailyStreak++;
            } else {
                this.data.dailyStreak = 1;
            }
            this.awardXP(10, 'Daily Login');
            dailyLoginAwarded = true;
        }
        
        if (dailyLoginAwarded) {
            const streakBonus = 10 * Math.min(this.data.dailyStreak, 30);
            if (streakBonus > 10) {
                this.awardXP(streakBonus - 10, 'Study Streak Bonus');
            }
        }
        
        this.data.lastStudyDate = new Date().toISOString();
        this.save();
    }
    
    generateDailyChallenges() {
        const shuffled = [...this.dailyChallengeTemplates].sort(() => Math.random() - 0.5);
        this.data.dailyChallenges = shuffled.slice(0, 3).map(challenge => ({
            ...challenge,
            completed: false,
            progress: 0
        }));
        this.save();
    }
    
    awardXP(amount, reason) {
        if (!this.data.settings.enabled) return;
        
        const previousLevel = this.getCurrentLevel();
        this.data.totalXP += amount;
        const newLevel = this.getCurrentLevel();
        
        this.showXPAnimation(amount, reason);
        
        if (newLevel.level > previousLevel.level) {
            this.onLevelUp(newLevel);
        }
        
        this.save();
    }
    
    getCurrentLevel() {
        return this.levels.find(level => 
            this.data.totalXP >= level.minXP && this.data.totalXP <= level.maxXP
        ) || this.levels[this.levels.length - 1];
    }
    
    getProgressToNextLevel() {
        const currentLevel = this.getCurrentLevel();
        if (currentLevel.level === 6) return 100;
        
        const xpInLevel = this.data.totalXP - currentLevel.minXP;
        const xpNeeded = currentLevel.maxXP - currentLevel.minXP + 1;
        return Math.round((xpInLevel / xpNeeded) * 100);
    }
    
    checkAchievements() {
        if (!this.data.settings.enabled) return;
        
        Object.values(this.achievements).forEach(achievement => {
            if (!this.data.achievements.some(a => a.id === achievement.id)) {
                if (achievement.condition()) {
                    this.unlockAchievement(achievement);
                }
            }
        });
    }
    
    unlockAchievement(achievement) {
        this.data.achievements.push({
            id: achievement.id,
            unlockedAt: new Date().toISOString()
        });
        
        this.showAchievementNotification(achievement);
        this.awardXP(100, `Achievement: ${achievement.name}`);
        this.save();
    }
    
    checkDailyChallenges() {
        if (!this.data.settings.enabled) return;
        
        // Update study time
        const now = Date.now();
        const studyDuration = now - this.sessionStartTime;
        this.dailyStats.studyTime += studyDuration;
        this.sessionStartTime = now; // Reset for next session
        
        this.data.dailyChallenges.forEach(challenge => {
            if (!challenge.completed && challenge.check()) {
                challenge.completed = true;
                this.awardXP(challenge.xp, `Daily Challenge: ${challenge.description}`);
            }
        });
        this.save();
    }
    
    // Integration methods
    onFlashcardReviewed(totalFlashcards = 45) {
        if (!this.data.settings.enabled) return;
        
        this.sessionStats.flashcardsReviewed++;
        this.dailyStats.flashcardsReviewed++;
        this.data.statistics.flashcardsReviewed++;
        this.flashcardSessionCount++;
        
        // Check speed reader achievement (50 flashcards in under 10 minutes)
        const sessionDuration = Date.now() - this.sessionStartTime;
        if (this.flashcardSessionCount >= 50 && sessionDuration < 600000) {
            this.sessionStats.duration = sessionDuration;
        }
        
        // Check if all flashcards reviewed today
        if (this.dailyStats.flashcardsReviewed >= totalFlashcards) {
            this.dailyStats.allFlashcardsReviewed = true;
        }
        
        this.awardXP(5, 'Flashcard Reviewed');
        this.checkAchievements();
        this.checkDailyChallenges();
        this.save();
    }
    
    onPracticeTestCompleted(score, totalQuestions) {
        if (!this.data.settings.enabled) return;
        
        this.dailyStats.testsCompleted++;
        this.data.statistics.practiceTestsCompleted++;
        this.lastTestScore = Math.round((score / totalQuestions) * 100);
        
        if (this.lastTestScore > this.dailyStats.highScore) {
            this.dailyStats.highScore = this.lastTestScore;
        }
        
        let xp = 50;
        if (this.lastTestScore >= 80) xp += 25;
        if (this.lastTestScore === 100) {
            xp += 150; // Total 225 for perfect
            this.data.statistics.perfectScores++;
            this.dailyStats.perfectCategoryScore = true;
        }
        
        this.awardXP(xp, 'Practice Test Completed');
        this.checkAchievements();
        this.checkDailyChallenges();
        this.save();
    }
    
    onFullTestCompleted(score, totalQuestions) {
        if (!this.data.settings.enabled) return;
        
        this.data.statistics.fullTestsCompleted++;
        this.lastTestScore = Math.round((score / totalQuestions) * 100);
        
        let xp = 100;
        if (this.lastTestScore >= 90) xp += 50;
        if (this.lastTestScore === 100) {
            xp += 150; // Total 300 for perfect
            this.data.statistics.perfectScores++;
        }
        
        this.awardXP(xp, 'Full Test Completed');
        this.checkAchievements();
        this.checkDailyChallenges();
        this.save();
    }
    
    onScenarioCompleted(totalScenarios = 20) {
        if (!this.data.settings.enabled) return;
        
        this.dailyStats.scenariosCompleted++;
        this.data.statistics.scenariosCompleted++;
        
        // Check if all scenarios completed
        if (this.data.statistics.scenariosCompleted >= totalScenarios) {
            this.allScenariosCompleted = true;
        }
        
        this.awardXP(20, 'Scenario Completed');
        this.checkAchievements();
        this.checkDailyChallenges();
        this.save();
    }
    
    onCategoryStudied(category) {
        if (!this.data.settings.enabled) return;
        
        if (!this.dailyStats.categoriesStudied.includes(category)) {
            this.dailyStats.categoriesStudied.push(category);
        }
        
        if (!this.data.statistics.categoriesStudied[category]) {
            this.data.statistics.categoriesStudied[category] = 0;
        }
        this.data.statistics.categoriesStudied[category]++;
        
        // Check if all categories have been reviewed
        const allCategories = [
            "Billing", "Billing Codes", "Claims Disputes", "Claims Processing",
            "Compliance", "Data Systems", "Documentation", "Eligibility",
            "Employment", "Financial Assistance", "Payment Methods", "Program Overview",
            "Provider Qualifications", "Provider Requirements", "Quality & Compliance",
            "Service Authorization", "Service Components", "Service Delivery", "Service Types"
        ];
        
        if (allCategories.every(cat => this.dailyStats.categoriesStudied.includes(cat))) {
            this.dailyStats.allCategoriesReviewed = true;
        }
        
        this.checkDailyChallenges();
        this.save();
    }
    
    // UI methods
    showXPAnimation(amount, reason) {
        if (!this.data.settings.animationsEnabled) return;
        
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.innerHTML = `
            <div class="xp-amount">+${amount} XP</div>
            <div class="xp-reason">${reason}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate');
        }, 10);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        if (this.data.settings.soundEnabled) {
            this.playSound('xp');
        }
    }
    
    showAchievementNotification(achievement) {
        if (!this.data.settings.animationsEnabled) return;
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
        
        if (this.data.settings.soundEnabled) {
            this.playSound('achievement');
        }
        
        this.showConfetti();
    }
    
    onLevelUp(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-title">Level Up!</div>
            <div class="level-up-level">Level ${newLevel.level}</div>
            <div class="level-up-name">${newLevel.title}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
        
        if (this.data.settings.soundEnabled) {
            this.playSound('levelup');
        }
        
        this.showConfetti();
    }
    
    showConfetti() {
        if (!this.data.settings.animationsEnabled) return;
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }
    
    playSound(type) {
        if (!this.data.settings.soundEnabled) return;
        
        const audio = new Audio();
        switch (type) {
            case 'xp':
                audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
                break;
            case 'achievement':
                audio.src = 'data:audio/wav;base64,UklGRnwGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQwGAACEhYmEblxgbI2opcB3Qz1nr8vxuHkpCVCh0/rblTcIKXrG7+mmUBEMUKXg+KphHQYxkM/2unsoBS16yO/eizEIHWq+8+qRPgkVYLPq9KlUFApGnuL9t1weBDCG0/jUgCoF';
                break;
            case 'levelup':
                audio.src = 'data:audio/wav;base64,UklGRnYGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQYGAACDhYyHb1xhcp+suZNiPkKJx9/gsHAwBjiS0/LHeywFJnrM8tiOOwgZZ73v5Z5NEQxQqOPws2MdBjiP1/fNeSsFI3fH8+CMNwgUXrPt66RPEAlFn+H9u2IgBDCExfXOfjIG';
                break;
        }
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }
    
    renderDashboard() {
        const currentLevel = this.getCurrentLevel();
        const progress = this.getProgressToNextLevel();
        const unlockedAchievements = this.data.achievements.length;
        const totalAchievements = Object.keys(this.achievements).length;
        
        return `
            <div class="gamification-dashboard">
                <div class="dashboard-header">
                    <h2>My Progress</h2>
                    <button id="toggleGamification" class="toggle-btn ${this.data.settings.enabled ? 'enabled' : ''}">
                        ${this.data.settings.enabled ? 'Gamification ON' : 'Gamification OFF'}
                    </button>
                </div>
                
                <div class="level-section">
                    <div class="level-info">
                        <div class="level-badge">
                            <span class="level-number">${currentLevel.level}</span>
                        </div>
                        <div class="level-details">
                            <h3>${currentLevel.title}</h3>
                            <div class="xp-info">${this.data.totalXP} XP</div>
                        </div>
                    </div>
                    <div class="level-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${progress}% to next level</div>
                    </div>
                </div>
                
                <div class="streak-section">
                    <div class="streak-icon">${this.getStreakEmoji()}</div>
                    <div class="streak-info">
                        <h3>${this.data.dailyStreak} Day Streak</h3>
                        <p>Keep studying daily to maintain your streak!</p>
                    </div>
                </div>
                
                <div class="daily-challenges">
                    <h3>Daily Challenges</h3>
                    <div class="challenges-list">
                        ${this.data.dailyChallenges.map(challenge => `
                            <div class="challenge ${challenge.completed ? 'completed' : ''}">
                                <div class="challenge-info">
                                    <div class="challenge-description">${challenge.description}</div>
                                    <div class="challenge-reward">+${challenge.xp} XP</div>
                                </div>
                                ${challenge.completed ? 
                                    '<div class="challenge-status">✓</div>' : 
                                    '<div class="challenge-progress"></div>'
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="achievements-section">
                    <h3>Achievements (${unlockedAchievements}/${totalAchievements})</h3>
                    <div class="achievements-grid">
                        ${Object.values(this.achievements).map(achievement => {
                            const unlocked = this.data.achievements.some(a => a.id === achievement.id);
                            return `
                                <div class="achievement-badge ${unlocked ? 'unlocked' : 'locked'}">
                                    <div class="badge-icon">${unlocked ? achievement.icon : '🔒'}</div>
                                    <div class="badge-name">${achievement.name}</div>
                                    <div class="badge-description">${achievement.description}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="stats-section">
                    <h3>Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.data.statistics.flashcardsReviewed}</div>
                            <div class="stat-label">Flashcards Reviewed</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.data.statistics.practiceTestsCompleted}</div>
                            <div class="stat-label">Practice Tests</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.data.statistics.perfectScores}</div>
                            <div class="stat-label">Perfect Scores</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.data.statistics.scenariosCompleted}</div>
                            <div class="stat-label">Scenarios Completed</div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Settings</h3>
                    <label class="setting-toggle">
                        <input type="checkbox" id="soundToggle" ${this.data.settings.soundEnabled ? 'checked' : ''}>
                        <span>Sound Effects</span>
                    </label>
                    <label class="setting-toggle">
                        <input type="checkbox" id="animationToggle" ${this.data.settings.animationsEnabled ? 'checked' : ''}>
                        <span>Animations</span>
                    </label>
                </div>
            </div>
        `;
    }
    
    getStreakEmoji() {
        if (this.data.dailyStreak === 0) return '❄️';
        if (this.data.dailyStreak < 3) return '🔥';
        if (this.data.dailyStreak < 7) return '🔥🔥';
        if (this.data.dailyStreak < 14) return '🔥🔥🔥';
        if (this.data.dailyStreak < 30) return '🔥🔥🔥🔥';
        return '🔥🔥🔥🔥🔥';
    }
}

// Initialize gamification system
const gamification = new GamificationSystem();
window.gamification = gamification;