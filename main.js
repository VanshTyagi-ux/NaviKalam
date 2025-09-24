// This is the main entry point for the application's JavaScript.

// --- IMPORTS ---
import { startHostSession, joinSession, scanStudentAnswer } from './offlineSync.js';
import { translations } from './data.js';
import { initCanvas, setTool, setPenSize, setPenColor, clearCanvas, undoLast, saveDrawing } from './whiteboard.js';

// Firebase imports for authentication and database
import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// App module imports
import * as state from './state.js';
import * as ui from './ui.js';
import * as teacher from './teacher.js';
import * as practiceTest from './practiceTest.js';
import * as firebase from './firebase.js';
import * as guide from './guide.js';


// --- TRANSLATION HELPERS ---
export function t(key) {
    if (!translations[key]) return key;
    return translations[key][state.currentLanguage] || translations[key]['english'];
}
        
export function ts(subjectNameObject) {
    return subjectNameObject[state.currentLanguage] || subjectNameObject['english'];
}


// --- CORE NAVIGATION AND SETUP ---
function selectLanguage(lang) {
    state.setCurrentLanguage(lang);
    ui.updateStaticUIText();
    ui.showScreen('role');
}

function selectRole(role) { 
    ui.showScreen(role === 'student' ? 'studentLogin' : 'teacherLogin'); 
}

function changeLanguage(lang) {
    state.setCurrentLanguage(lang);
    ui.updateStaticUIText();
    if (ui.screens.main.classList.contains('active')) {
        ui.showMainContent(state.currentMainContent);
    }
    if (ui.screens.teacherDashboard.classList.contains('active')) {
        teacher.showTeacherContent(state.currentTeacherContent);
    }
}


// --- AUTHENTICATION FUNCTIONS (UPDATED) ---

/**
 * Handles user login using Firebase Authentication.
 */
async function login(role) {
    const emailInputId = role === 'student' ? 'student-email-input' : 'teacher-email-input';
    const passwordInputId = role === 'student' ? 'student-password-input' : 'teacher-password-input';

    const email = document.getElementById(emailInputId).value;
    const password = document.getElementById(passwordInputId).value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        // 1. Sign in the user with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Get the user's profile from the Firestore 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            alert("No user profile found for this account!");
            return;
        }

        const userProfile = userDoc.data();

        // 3. Check if the user's role matches the login screen
        if (userProfile.role !== role) {
            alert(`You are a ${userProfile.role}. Please use the correct login page.`);
            return;
        }

        // 4. Set the current user and show the correct screen
        state.setCurrentUser({ id: user.uid, ...userProfile });
        document.getElementById('menu-username').innerText = state.currentUser.name;

        if (role === 'student') {
            ui.showScreen('main');
            ui.showMainContent('home');
            if (!localStorage.getItem('naviKalamStudentGuideShown')) {
                guide.startGuide('student');
            }
        } else { // Teacher
            ui.showScreen('teacherDashboard');
            teacher.showTeacherContent('progress');
            if (!localStorage.getItem('naviKalamTeacherGuideShown')) {
                guide.startGuide('teacher');
            }
        }

    } catch (error) {
        console.error("Login Error:", error);
        alert("Login failed: " + error.message);
    }
}

/**
 * Handles new user registration and automatically logs them in.
 */
async function signUp(role) {
    let name, email, password;

    if (role === 'student') {
        name = document.getElementById('signup-student-name').value;
        email = document.getElementById('signup-student-email').value;
        password = document.getElementById('signup-student-password').value;
    } else { // teacher
        name = document.getElementById('signup-teacher-name').value;
        email = document.getElementById('signup-teacher-email').value;
        password = document.getElementById('signup-teacher-password').value;
    }

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    // This function is in firebase.js and creates the user
    const result = await firebase.handleSignUp(name, email, password, role);

    // If sign-up is successful, log the new user in
    if (result.success && result.user) {
        const user = result.user;

        // Fetch the newly created profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
             // Set the current user state
            state.setCurrentUser({ id: user.uid, ...userDoc.data() });
            document.getElementById('menu-username').innerText = state.currentUser.name;

            // Navigate to the correct dashboard
            if (role === 'student') {
                ui.showScreen('main');
                ui.showMainContent('home');
            } else {
                ui.showScreen('teacherDashboard');
                teacher.showTeacherContent('progress');
            }
        }
    }
}


// --- GLOBAL FUNCTION ASSIGNMENTS ---
// Makes functions accessible from the HTML onclick attributes.
window.selectLanguage = selectLanguage;
window.startHostSession = startHostSession;
window.joinSession = joinSession;
window.scanStudentAnswer = scanStudentAnswer;
window.selectRole = selectRole;
window.login = login;
window.signUp = signUp;
window.changeLanguage = changeLanguage;

// UI Functions
window.showScreen = ui.showScreen;
window.toggleMenu = ui.toggleMenu;
window.toggleTeacherMenu = ui.toggleTeacherMenu;
window.showMainContent = ui.showMainContent;
window.showChapterList = ui.showChapterList;
window.openLesson = ui.openLesson;
window.showLessonTab = ui.showLessonTab;
window.checkAnswer = ui.checkAnswer;
window.toggleTheme = ui.toggleTheme;
window.toggleViewMode = ui.toggleViewMode;
window.toggleQuestionModal = ui.toggleQuestionModal;
window.selectAvatar = ui.selectAvatar;
window.openNotesViewer = ui.openNotesViewer;
window.closeNotesViewer = ui.closeNotesViewer;
window.showInbuiltContent = ui.showInbuiltContent;
window.showInbuiltChapterList = ui.showInbuiltChapterList;
window.displayInbuiltContent = ui.displayInbuiltContent;

// Teacher Functions
window.showTeacherContent = teacher.showTeacherContent;
window.showStudentDetails = teacher.showStudentDetails;
window.toggleAddStudentModal = teacher.toggleAddStudentModal;
window.selectNewStudentAvatar = teacher.selectNewStudentAvatar;
window.addNewStudent = teacher.addNewStudent;
window.markStudent = teacher.markStudent;
window.toggleEditTimetableModal = teacher.toggleEditTimetableModal;
window.saveTimetable = teacher.saveTimetable;
window.toggleStudentActionsDropdown = teacher.toggleStudentActionsDropdown;
window.showTestReportDetails = teacher.showTestReportDetails;
window.closeTestReportModal = teacher.closeTestReportModal;
window.showContentDetails = teacher.showContentDetails;

// Practice Test Functions
window.renderTestSubjectSelection = practiceTest.renderTestSubjectSelection;
window.renderTestChapterSelection = practiceTest.renderTestChapterSelection;
window.startPracticeTest = practiceTest.startPracticeTest;
window.checkTestAnswer = practiceTest.checkTestAnswer;
window.nextTestQuestion = practiceTest.nextTestQuestion;
window.skipTestQuestion = practiceTest.skipTestQuestion;
window.stopTestAndShowResults = practiceTest.stopTestAndShowResults;
window.previousTestQuestion = practiceTest.previousTestQuestion;

// Guide Functions
window.startGuide = guide.startGuide;
window.nextGuideStep = guide.nextGuideStep;
window.endGuide = guide.endGuide;

// Firebase Functions
window.submitQuestion = firebase.submitQuestion;
window.loadDoubtForum = firebase.loadDoubtForum;

// Whiteboard Functions
window.initCanvas = initCanvas;
window.setTool = setTool;
window.setPenSize = setPenSize;
window.setPenColor = setPenColor;
window.clearCanvas = clearCanvas;
window.undoLast = undoLast;
window.saveDrawing = saveDrawing;


// --- APP INITIALIZATION ---
window.onload = async () => {
    // Theme and View Mode setup
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        const themeToggle = document.getElementById('theme-toggle-checkbox');
        if (themeToggle) themeToggle.checked = true;
    }
    if (localStorage.getItem('viewMode') === 'website') {
        document.getElementById('app-container').classList.add('view-website');
    }
    ui.createAvatarAssets();

    // Wait for Firebase to initialize BEFORE showing the app
    await firebase.initFirebase();

    // Now that Firebase is ready, show the language screen
    ui.showScreen('language'); 

    // Service Worker registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered.'))
            .catch(error => console.error('Service Worker registration failed:', error));
    }
};