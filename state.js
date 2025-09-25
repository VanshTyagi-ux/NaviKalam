// This file holds the shared, mutable state for the entire application.
export let avatarUris = {};
export let currentUser = { id: 99, name: "Student", avatar: "avatar1" };
export let currentLanguage = 'english';
export let currentMainContent = 'home';
export let currentTeacherContent = 'progress';
export let currentSubjectEnglishName = '';
export let unsubscribeDoubtListener = null;

// Firebase State
export let app, db, auth, appId, userId;

// --- Test State Object ---
// We group all test-related state into this single object for reliability.
export const testState = {
    questions: [],
    currentIndex: 0,
    score: 0,
    subject: '',
    chapter: '',
    timer: 0,
    timerInterval: null,
    detailedResults: [],
    questionStartTime: 0
};

// --- Functions to update state ---
export function setCurrentUser(user) { currentUser = user; }
export function setCurrentLanguage(lang) { currentLanguage = lang; }
export function setCurrentMainContent(content) { currentMainContent = content; }
export function setCurrentTeacherContent(content) { currentTeacherContent = content; }
export function setCurrentSubjectEnglishName(name) { currentSubjectEnglishName = name; }
export function setUnsubscribeDoubtListener(listener) { unsubscribeDoubtListener = listener; }

export function setFirebaseState(firebaseState) {
    app = firebaseState.app;
    db = firebaseState.db;
    auth = firebaseState.auth;
    appId = firebaseState.appId;
    userId = firebaseState.userId;
}

// --- Functions for Practice Test State (now modifying the testState object) ---
export function setPracticeTestData(data) {
    testState.questions = data.questions || [];
    testState.currentIndex = data.index || 0;
    testState.score = data.score || 0;
    testState.subject = data.subject || '';
    testState.chapter = data.chapter || '';
    testState.detailedResults = data.detailedResults || [];
    testState.timer = data.timer || 0;
}
export function setTestTimerInterval(intervalId) { testState.timerInterval = intervalId; }
export function setQuestionStartTime(time) { testState.questionStartTime = time; }
export function addDetailedTestResult(result) { testState.detailedResults.push(result); }
export function incrementUserScore() { testState.score++; }
export function incrementQuestionIndex() { testState.currentIndex++; }
// In state.js, add this function with the other testState functions

export function decrementQuestionIndex() { testState.currentIndex--; }
/**
 * Resets the practice test state to its initial values and clears any running timer.
 */
export function resetPracticeTestData() {
    if (testState.timerInterval) {
        clearInterval(testState.timerInterval);
    }
    testState.questions = [];
    testState.currentIndex = 0;
    testState.score = 0;
    testState.subject = '';
    testState.chapter = '';
    testState.timer = 0;
    testState.timerInterval = null;
    testState.detailedResults = [];
    testState.questionStartTime = 0;
}