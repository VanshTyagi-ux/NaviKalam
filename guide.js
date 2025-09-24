// This file manages the logic for the interactive onboarding guide.

import * as state from './state.js';
import * as ui from './ui.js';
import { t } from './main.js';

let currentGuideSteps = [];
let currentGuideStep = 0;
let highlightedElement = null;

// --- Guide Step Definitions ---

const studentGuideSteps = [
    { elementId: 'bottom-nav', textKey: 'guide_step1', position: 'top', action: () => { ui.showScreen('main'); ui.showMainContent('home'); }},
    { elementId: 'nav-learn', textKey: 'guide_step2', position: 'top' },
    { elementId: 'subject-cards', textKey: 'guide_step3', position: 'top', action: () => { ui.showScreen('main'); ui.showMainContent('home'); }},
    { elementId: 'nav-practice', textKey: 'guide_step4', position: 'top' },
    { elementId: 'doubt-forum-button', textKey: 'guide_step5', position: 'bottom', action: () => { window.showChapterList('Science'); }},
];

const teacherGuideSteps = [
    { elementId: 'teacher-progress-title', textKey: 'teacher_guide_step1', position: 'bottom', action: () => { ui.showScreen('teacherDashboard'); window.showTeacherContent('progress'); }},
    { elementId: 'nav-teacher-uploads', textKey: 'teacher_guide_step2', position: 'top', action: () => { window.showTeacherContent('uploads'); }},
    { elementId: 'nav-teacher-add', textKey: 'teacher_guide_step3', position: 'top', action: () => { window.showTeacherContent('progress'); }},
    // MODIFICATION: Target the new card ID and change the position
    { elementId: 'student-card-0', textKey: 'teacher_guide_step4', position: 'left', action: () => { window.showTeacherContent('progress'); }},
];


/**
 * Starts the interactive guide based on the user's role.
 * @param {string} role - 'student' or 'teacher'
 */
export function startGuide(role = 'student') {
    currentGuideStep = 0;
    
    if (role === 'teacher') {
        currentGuideSteps = teacherGuideSteps;
    } else {
        currentGuideSteps = studentGuideSteps;
    }

    document.getElementById('guide-overlay').classList.remove('hidden');
    showGuideStep(currentGuideStep);
}

export function nextGuideStep() {
    currentGuideStep++;
    if (currentGuideStep < currentGuideSteps.length) {
        showGuideStep(currentGuideStep);
    } else {
        endGuide();
    }
}

export function endGuide() {
    const guideOverlay = document.getElementById('guide-overlay');
    guideOverlay.classList.add('hidden');
    document.getElementById('guide-tooltip').classList.remove('active');
    if (highlightedElement) {
        highlightedElement.classList.remove('guide-highlight');
        highlightedElement = null;
    }
    // MODIFICATION: Use separate localStorage keys for each guide
if (currentGuideSteps === teacherGuideSteps) {
    localStorage.setItem('naviKalamTeacherGuideShown', 'true');
} else {
    localStorage.setItem('naviKalamStudentGuideShown', 'true');
}
    
    // Ensure the user is returned to their primary screen
    if (ui.screens.teacherDashboard.classList.contains('active')) {
         window.showTeacherContent(state.currentTeacherContent);
    } else if (!ui.screens.main.classList.contains('active') || state.currentMainContent !== 'home') {
         ui.showScreen('main'); 
         ui.showMainContent('home');
    }
}

export function showGuideStep(stepIndex) {
    if (highlightedElement) {
        highlightedElement.classList.remove('guide-highlight');
    }
    
    const step = currentGuideSteps[stepIndex];
    
    if (step.action) {
        step.action();
    }

    setTimeout(() => {
        const element = document.getElementById(step.elementId);
        if (!element) {
            console.warn(`Guide element not found: ${step.elementId}`);
            nextGuideStep(); // Skip broken step
            return;
        }
        highlightedElement = element;
        element.classList.add('guide-highlight');
        
        const tooltip = document.getElementById('guide-tooltip');
        const guideText = document.getElementById('guide-text');
        
        const translatedText = t(step.textKey);
        if (typeof translatedText === 'function') {
            guideText.innerHTML = translatedText(state.currentUser.name);
        } else {
            guideText.innerHTML = translatedText;
        }

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // This version ensures positioning logic does not conflict.
        if (step.position === 'top') {
            tooltip.style.top = `${rect.top - tooltipRect.height - 15}px`;
            // Horizontal centering for 'top'
            let leftPos = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            if (leftPos < 10) leftPos = 10;
            if ((leftPos + tooltipRect.width) > window.innerWidth - 10) {
                leftPos = window.innerWidth - tooltipRect.width - 10;
            }
            tooltip.style.left = `${leftPos}px`;

        } else if (step.position === 'left') {
            // Specific positioning for 'left'
            tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltipRect.height / 2)}px`;
            tooltip.style.left = `${rect.left - tooltipRect.width - 15}px`;

        } else { // Default to 'bottom'
            tooltip.style.top = `${rect.bottom + 15}px`;
            // Horizontal centering for 'bottom'
            let leftPos = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            if (leftPos < 10) leftPos = 10;
            if ((leftPos + tooltipRect.width) > window.innerWidth - 10) {
                leftPos = window.innerWidth - tooltipRect.width - 10;
            }
            tooltip.style.left = `${leftPos}px`;
        }
        
        const nextButton = document.getElementById('guide_next_button');
        if (stepIndex === currentGuideSteps.length - 1) {
            nextButton.innerText = t('finish');
        } else {
            nextButton.innerText = t('next');
        }
        tooltip.classList.add('active');
    }, 200);
}
