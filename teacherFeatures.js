// This file contains logic for new teacher features like assignments and announcements.

import { subjects, chapters, questionBank, assignments, announcements } from './data.js';
import { t, ts } from './main.js';

// --- Assignment Module ---

export function renderAssignmentCreator() {
    const container = document.getElementById('teacher-main-content');
    const subjectsOptions = subjects.map(s => `<option value="${s.name.english}">${ts(s.name)}</option>`).join('');

    container.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Create Assignment</h3>
                <button onclick="showTeacherContent('home')" class="text-sm bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-gray-600">Back</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-4">
                <div>
                    <label for="assignment-subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                    <select id="assignment-subject" onchange="updateChapterOptions(this.value)" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option>Select a Subject</option>
                        ${subjectsOptions}
                    </select>
                </div>
                <div>
                    <label for="assignment-chapter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Chapter/Topic</label>
                    <select id="assignment-chapter" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option>Select a Subject First</option>
                    </select>
                </div>
                <div>
                    <label for="assignment-due-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                    <input type="date" id="assignment-due-date" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                </div>
                <button onclick="createAssignment()" class="w-full bg-teal-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-600">Assign</button>
            </div>
        </div>
    `;
}

export function updateChapterOptions(subjectName) {
    const chapterSelect = document.getElementById('assignment-chapter');
    const subjectChapters = chapters[subjectName] || [];
    if (subjectChapters.length === 0) {
        chapterSelect.innerHTML = `<option>No chapters available</option>`;
        return;
    }
    chapterSelect.innerHTML = subjectChapters.map(c => `<option value="${c.name.english}">${ts(c.name)}</option>`).join('');
}

export function createAssignment() {
    const subject = document.getElementById('assignment-subject').value;
    const chapter = document.getElementById('assignment-chapter').value;
    const dueDate = document.getElementById('assignment-due-date').value;

    if (!subject || !chapter || !dueDate) {
        alert('Please fill out all fields.');
        return;
    }

    const newAssignment = {
        id: Date.now(),
        subject,
        chapter,
        dueDate,
        completed: false // This would be tracked per-student in a real app
    };
    assignments.push(newAssignment);
    alert('Assignment created successfully!');
    window.showTeacherContent('home');
}


// --- Custom Quiz Builder ---

export function renderQuizBuilder() {
    const container = document.getElementById('teacher-main-content');
    const subjectsOptions = subjects.map(s => `<option value="${s.name.english}">${ts(s.name)}</option>`).join('');

    container.innerHTML = `
         <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Add Quiz Question</h3>
                <button onclick="showTeacherContent('home')" class="text-sm bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-gray-600">Back</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-4">
                <div>
                    <label class="block text-sm font-medium">Subject & Chapter</label>
                    <div class="flex gap-2 mt-1">
                        <select id="quiz-subject" onchange="updateQuizChapterOptions(this.value)" class="block w-1/2 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                            <option>Select Subject</option>${subjectsOptions}
                        </select>
                        <select id="quiz-chapter" class="block w-1/2 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                            <option>Select Chapter</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label for="quiz-question-text" class="block text-sm font-medium">Question</label>
                    <textarea id="quiz-question-text" rows="2" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium">Options</label>
                    <input type="text" id="quiz-option-1" placeholder="Correct Answer" class="mt-1 block w-full p-2 border-green-500 border-2 rounded-md shadow-sm">
                    <input type="text" id="quiz-option-2" placeholder="Wrong Answer 1" class="mt-2 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                    <input type="text" id="quiz-option-3" placeholder="Wrong Answer 2" class="mt-2 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                    <input type="text" id="quiz-option-4" placeholder="Wrong Answer 3" class="mt-2 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                </div>
                <button onclick="saveCustomQuestion()" class="w-full bg-teal-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-600">Save Question</button>
            </div>
        </div>
    `;
}

export function updateQuizChapterOptions(subjectName) {
    const chapterSelect = document.getElementById('quiz-chapter');
    const subjectChapters = chapters[subjectName] || [];
    chapterSelect.innerHTML = subjectChapters.map(c => `<option value="${c.name.english}">${ts(c.name)}</option>`).join('');
}

export function saveCustomQuestion() {
    const subject = document.getElementById('quiz-subject').value;
    const chapter = document.getElementById('quiz-chapter').value;
    const question = document.getElementById('quiz-question-text').value;
    const correctAnswer = document.getElementById('quiz-option-1').value;
    const options = [
        correctAnswer,
        document.getElementById('quiz-option-2').value,
        document.getElementById('quiz-option-3').value,
        document.getElementById('quiz-option-4').value,
    ].filter(opt => opt.trim() !== '');

    if (!subject || !chapter || !question || options.length < 2) {
        alert('Please fill out all required fields.');
        return;
    }

    const newQuestion = { question, options, correctAnswer };
    
    if (!questionBank[subject]) questionBank[subject] = {};
    if (!questionBank[subject][chapter]) questionBank[subject][chapter] = [];
    
    questionBank[subject][chapter].push(newQuestion);
    alert('New question added to the question bank!');
    window.showTeacherContent('home');
}


// --- Announcements Module ---

export function renderAnnouncementCreator() {
    const container = document.getElementById('teacher-main-content');
    container.innerHTML = `
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Post Announcement</h3>
                <button onclick="showTeacherContent('home')" class="text-sm bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-gray-600">Back</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-4">
                <div>
                    <label for="announcement-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Message for the Class</label>
                    <textarea id="announcement-text" rows="4" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"></textarea>
                </div>
                <button onclick="postAnnouncement()" class="w-full bg-teal-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-teal-600">Post to Class</button>
            </div>
        </div>
    `;
}

export function postAnnouncement() {
    const message = document.getElementById('announcement-text').value;
    if (!message.trim()) {
        alert('Please enter a message.');
        return;
    }
    const newAnnouncement = {
        id: Date.now(),
        message,
        date: new Date().toLocaleDateString()
    };
    announcements.unshift(newAnnouncement); // Add to the beginning
    alert('Announcement posted!');
    window.showTeacherContent('home');
}