// This file contains all logic for the "Take a Test" feature with time tracking.

// --- IMPORTS ---
import { subjects, chapters, questionBank } from './data.js';
// Firebase is no longer needed for this frontend-only feature
// import { db } from './firebase.js';
// import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import { triggerConfetti, showScreen, showMainContent } from './ui.js';
import { t, ts } from './main.js';

// --- NEW FRONTEND REWARD HELPER FUNCTIONS ---

/**
 * (Frontend-only) Awards points and saves them to local storage.
 * @param {number} pointsToAdd The number of points to add.
 * @returns {object} The updated rewards data.
 */
function awardPoints(pointsToAdd) {
    const studentId = state.currentUser.id;
    if (!studentId) return;

    const rewardsKey = `naviKalamRewards_${studentId}`;
    let rewardsData = JSON.parse(localStorage.getItem(rewardsKey)) || {
        totalPoints: 0,
        badges: []
    };

    rewardsData.totalPoints += pointsToAdd;
    localStorage.setItem(rewardsKey, JSON.stringify(rewardsData));
    console.log(`${pointsToAdd} points awarded and saved locally.`);
    return rewardsData; // Return the updated data
}

/**
 * (Frontend-only) Checks for and awards badges based on points.
 * @param {object} rewardsData The student's current rewards data.
 */
function checkAndAwardBadges(rewardsData) {
    const studentId = state.currentUser.id;
    if (!studentId) return;

    const badges = {
        "badge_science_whiz": { requiredPoints: 50 },
        "badge_quick_learner": { requiredPoints: 200 }
    };

    let newBadgesEarned = false;
    for (const badgeKey in badges) {
        if (rewardsData.totalPoints >= badges[badgeKey].requiredPoints && !rewardsData.badges.includes(badgeKey)) {
            rewardsData.badges.push(badgeKey);
            newBadgesEarned = true;
            console.log(`New badge earned: ${badgeKey}`);
        }
    }

    if (newBadgesEarned) {
        const rewardsKey = `naviKalamRewards_${studentId}`;
        localStorage.setItem(rewardsKey, JSON.stringify(rewardsData));
    }
}


// --- HELPER FUNCTIONS ---
function getTestText(textObject) {
    if (typeof textObject !== 'object' || textObject === null) {
        return textObject;
    }
    if (state.testState.subject === 'English' && textObject.english) {
        return textObject.english;
    }
    return ts(textObject);
}

function updateTimerUI() {
    if (state.testState.timer > 0) {
        state.testState.timer--;
    }
    
    const timerDisplay = document.getElementById('test-timer-display');
    if (timerDisplay) {
        const minutes = Math.floor(state.testState.timer / 60);
        const seconds = ('0' + state.testState.timer % 60).slice(-2);
        timerDisplay.innerText = `Time Left: ${minutes}:${seconds}`;
    }

    if (state.testState.timer <= 0) {
        clearInterval(state.testState.timerInterval);
        showTestResults(true);
    }
}

// --- UI RENDERING FUNCTIONS ---
export function renderTestSubjectSelection() {
    state.resetPracticeTestData();
    document.getElementById('stop-test-btn').classList.add('hidden');
    
    document.getElementById('practice-test-title').innerText = t('select_subject');
    const container = document.getElementById('practice-test-content');

    container.innerHTML = `<div class="space-y-4">${subjects.map(s => `
        <div class="subject-button slide-up bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all" data-subject="${s.name.english}">
            <div class="bg-${s.color}-100 dark:bg-${s.color}-900/50 w-16 h-16 rounded-lg flex items-center justify-center pointer-events-none">
                <i class="fas ${s.icon} text-3xl text-${s.color}-500"></i>
            </div>
            <div class="pointer-events-none">
                <h4 class="font-bold text-xl text-gray-800 dark:text-white">${ts(s.name)}</h4>
            </div>
        </div>
    `).join('')}</div>`;

    container.querySelectorAll('.subject-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const subjectName = event.currentTarget.dataset.subject;
            renderTestChapterSelection(subjectName);
        });
    });
}

export function renderTestChapterSelection(subjectName) {
    state.setPracticeTestData({ subject: subjectName });
    state.setCurrentSubjectEnglishName(subjectName);
    document.getElementById('practice-test-title').innerText = t('select_topic');
    const container = document.getElementById('practice-test-content');
    const subjectChapters = chapters[subjectName] || [];

    if (subjectChapters.length === 0) {
        container.innerHTML = `<button id="back-to-subjects-btn" class="text-teal-500 font-semibold mb-4">&larr; ${t('back_to_subjects')}</button>
        <p class="text-center text-gray-500 dark:text-gray-400">No topics with tests available for this subject yet.</p>`;
    } else {
        container.innerHTML = `<button id="back-to-subjects-btn" class="text-teal-500 font-semibold mb-4">&larr; ${t('back_to_subjects')}</button>
        <div class="space-y-3">${subjectChapters.map(c => `
            <div class="chapter-button bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" data-chapter="${c.name.english}">
                <h4 class="font-semibold text-gray-800 dark:text-white pointer-events-none">${ts(c.name)}</h4>
                <i class="fas fa-chevron-right text-gray-400 pointer-events-none"></i>
            </div>
        `).join('')}</div>`;

        container.querySelectorAll('.chapter-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const chapterName = event.currentTarget.dataset.chapter;
                startPracticeTest(subjectName, chapterName);
            });
        });
    }
    
    container.querySelector('#back-to-subjects-btn').addEventListener('click', renderTestSubjectSelection);
}

function renderTestQuestion() {
    try {
        const container = document.getElementById('practice-test-content');
        const question = state.testState.questions[state.testState.currentIndex];
        const shuffledIndices = question.options.map((_, i) => i).sort(() => 0.5 - Math.random());
        const minutes = Math.floor(state.testState.timer / 60);
        const seconds = ('0' + state.testState.timer % 60).slice(-2);

        const isFirstQuestion = state.testState.currentIndex === 0;
        const isLastQuestion = state.testState.currentIndex === state.testState.questions.length - 1;

        container.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center text-sm font-semibold">
                    <p class="text-teal-500">${t('question')} ${state.testState.currentIndex + 1} ${t('out_of')} ${state.testState.questions.length}</p>
                    <div class="flex items-center space-x-2">
                        <button onclick="previousTestQuestion()" class="py-1 px-4 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 text-sm text-gray-700 dark:text-gray-200 font-bold ${isFirstQuestion ? 'opacity-50 cursor-not-allowed' : ''}" ${isFirstQuestion ? 'disabled' : ''}>
                            &larr; Previous
                        </button>
                        <button onclick="nextTestQuestion()" class="py-1 px-4 bg-gray-200 dark:bg-gray-600 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 text-sm text-gray-700 dark:text-gray-200 font-bold ${isLastQuestion ? 'opacity-50 cursor-not-allowed' : ''}" ${isLastQuestion ? 'disabled' : ''}>
                            Next &rarr;
                        </button>
                        <p id="test-timer-display" class="text-gray-600 dark:text-gray-400 w-24 text-right">Time Left: ${minutes}:${seconds}</p>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mt-2">${getTestText(question.question)}</h3>
            </div>
            <div id="test-options-container" class="space-y-3">${shuffledIndices.map(index => `
                <button class="option-button w-full text-left p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow-sm border-2 border-transparent hover:border-teal-500 transition-colors" data-option-index="${index}">
                    ${getTestText(question.options[index])}
                </button>`).join('')}
            </div>
            <div id="test-feedback-container" class="mt-6"></div>`;

        state.setQuestionStartTime(Date.now());
        container.querySelectorAll('.option-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const selectedIndex = parseInt(event.currentTarget.dataset.optionIndex);
                checkTestAnswer(event.currentTarget, selectedIndex);
            });
        });
    } catch (error) {
        console.error("Error rendering question:", error);
        alert("An error occurred while rendering a question. Check the console for details.");
        clearInterval(state.testState.timerInterval);
    }
}


// --- TEST LOGIC FUNCTIONS ---
export function startPracticeTest(subjectName, chapterName) {
    try {
        const questions = questionBank[subjectName]?.[chapterName] || [];
        if (questions.length < 10) {
            alert("Not enough questions in the bank for this topic to start a test.");
            return;
        }
        
        const testData = {
            questions: questions.sort(() => 0.5 - Math.random()).slice(0, 10),
            index: 0, score: 0, subject: subjectName, chapter: chapterName, detailedResults: [],
            timer: 600 // 10 minutes
        };
        state.setPracticeTestData(testData);
        
        document.getElementById('stop-test-btn').classList.remove('hidden');

        clearInterval(state.testState.timerInterval);
        state.setTestTimerInterval(setInterval(updateTimerUI, 1000));

        const chapterObj = chapters[subjectName].find(c => c.name.english === chapterName);
        document.getElementById('practice-test-title').innerText = ts(chapterObj.name);
        renderTestQuestion();
    } catch (error) {
        console.error("Error starting test:", error);
        alert("An error occurred while starting the test. Check the console for details.");
    }
}

export function checkTestAnswer(buttonEl, selectedIndex) {
    const container = document.getElementById('test-options-container');
    container.querySelectorAll('button').forEach(button => button.disabled = true);
    
    const question = state.testState.questions[state.testState.currentIndex];
    const isCorrect = selectedIndex === question.correctAnswerIndex;
    const timeTaken = ((Date.now() - state.testState.questionStartTime) / 1000).toFixed(2);

    state.addDetailedTestResult({
        question: getTestText(question.question),
        isCorrect: isCorrect,
        timeTaken: parseFloat(timeTaken),
        skipped: false
    });

    if (isCorrect) {
        state.incrementUserScore();
        buttonEl.classList.add('bg-green-100', 'dark:bg-green-900/50', 'border-green-500');
        triggerConfetti();
    } else {
        buttonEl.classList.add('bg-red-100', 'dark:bg-red-900/50', 'border-red-500');
        const correctButton = container.querySelector(`[data-option-index="${question.correctAnswerIndex}"]`);
        if (correctButton) {
            correctButton.classList.add('bg-green-100', 'dark:bg-green-900/50', 'border-green-500');
        }
    }

    const feedbackContainer = document.getElementById('test-feedback-container');
    feedbackContainer.innerHTML = `<button id="next-question-btn" class="w-full bg-teal-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-600">${t('next_question')}</button>`;
    document.getElementById('next-question-btn').addEventListener('click', nextTestQuestion);
}

export function previousTestQuestion() {
    if (state.testState.currentIndex > 0) {
        state.decrementQuestionIndex();
        renderTestQuestion();
    }
}

export function skipTestQuestion() {
    const question = state.testState.questions[state.testState.currentIndex];
    const timeTaken = ((Date.now() - state.testState.questionStartTime) / 1000).toFixed(2);

    state.addDetailedTestResult({
        question: getTestText(question.question),
        isCorrect: false,
        timeTaken: parseFloat(timeTaken),
        skipped: true
    });
    
    nextTestQuestion();
}

export function stopTestAndShowResults() {
    showTestResults();
}

export function nextTestQuestion() {
    state.incrementQuestionIndex();
    if (state.testState.currentIndex < 10) {
        renderTestQuestion();
    } else {
        showTestResults();
    }
}

/**
 * MODIFIED: This function now saves results to local storage instead of Firestore.
 */
function showTestResults(timeUp = false) {
    if (timeUp && !document.getElementById('practice-test-content').querySelector('.text-3xl')) {
        alert("Time's up!");
    }
    clearInterval(state.testState.timerInterval);
    document.getElementById('stop-test-btn').classList.add('hidden');
    
    document.getElementById('practice-test-title').innerText = t('test_results');
    const container = document.getElementById('practice-test-content');
    
    const questionsAttempted = state.testState.detailedResults.length;
    if (questionsAttempted === 0) {
        // ... (this part remains unchanged)
        return;
    }

    // --- AWARD POINTS AND CHECK FOR BADGES (LOCAL) ---
    if (state.testState.score > 0) {
        const pointsToAward = state.testState.score * 10;
        const updatedRewards = awardPoints(pointsToAward);
        checkAndAwardBadges(updatedRewards);
    }
    // --- END LOCAL REWARDS LOGIC ---

    const scorePercentage = (state.testState.score / questionsAttempted) * 100;
    const feedbackIcon = scorePercentage >= 50 ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500';
    const totalTimeTaken = state.testState.detailedResults.reduce((sum, result) => sum + result.timeTaken, 0);
    const averageTime = (totalTimeTaken / questionsAttempted).toFixed(2);
    
    // The rest of this function (HTML rendering) remains the same
    let baseHtml = `<div class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <i class="fas ${feedbackIcon} text-6xl"></i>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white mt-4">${t('you_scored')} ${state.testState.score} ${t('out_of')} ${questionsAttempted}</h2>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-6">
            <div class="bg-teal-500 h-4 rounded-full" style="width: ${scorePercentage}%"></div>
        </div>
        <div class="flex flex-col md:flex-row gap-4 mt-8">
            <button id="try-again-btn" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-3 rounded-lg">${t('try_again')}</button>
            <button id="back-to-practice-btn" class="flex-1 bg-teal-500 text-white font-bold py-3 rounded-lg">${t('back_to_practice')}</button>
        </div>
    </div>`;
    
    let detailsHtml = `<div class="text-left mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
        <h4 class="font-bold text-lg text-gray-800 dark:text-white mb-3">Detailed Report</h4>
        <div class="text-sm space-y-2">
            <p><strong>Total Time Taken:</strong> ${totalTimeTaken.toFixed(2)} seconds</p>
            <p><strong>Average Time Per Question:</strong> ${averageTime} seconds</p>
        </div>
        <div class="mt-4 space-y-2">${state.testState.detailedResults.map((result, index) => {
            let resultText;
            let resultColorClass;
            if (result.skipped) {
                resultText = 'Skipped';
                resultColorClass = 'bg-yellow-100 dark:bg-yellow-800/60';
            } else if (result.isCorrect) {
                resultText = 'Correct';
                resultColorClass = 'bg-green-100 dark:bg-green-800/60';
            } else {
                resultText = 'Incorrect';
                resultColorClass = 'bg-red-100 dark:bg-red-800/60';
            }
            return `<div class="p-2 rounded-lg ${resultColorClass}">
                <p class="text-sm font-semibold">
                    <strong>Q${index + 1}:</strong> Took ${result.timeTaken}s - ${resultText}
                </p>
            </div>`;
        }).join('')}
        </div>
    </div>`;

    container.innerHTML = baseHtml + detailsHtml;
    
    document.getElementById('try-again-btn').addEventListener('click', () => {
        startPracticeTest(state.testState.subject, state.testState.chapter);
    });
    
    document.getElementById('back-to-practice-btn').addEventListener('click', () => {
        showScreen('main'); showMainContent('practice');
    });
}