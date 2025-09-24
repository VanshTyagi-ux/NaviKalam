// This file handles all logic for the Teacher Dashboard, now synced with Firestore.

// --- IMPORTS ---
import * as state from './state.js';
// Import only the necessary static data; students and test history will come from Firestore
import { subjects, chapters, timetableData, daysOfWeek, attendanceRecords, assignments, chapterNotes , videoLessons} from './data.js';
import { showScreen } from './ui.js';
import { t, ts } from './main.js';

// Import Firebase and Firestore functions
import { db } from './firebase.js';
import { collection, query, where, getDocs, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// --- STATE ---
let newStudentAvatar = null;
let activeStudentDropdown = null;
let studentCache = []; // A local cache to hold the fetched student list
let currentStudentTestHistory = []; // Holds the test history for the currently viewed student


// --- FILE UPLOAD HELPERS (No changes here) ---
function populateChapterSelect(subjectSelectId, chapterSelectId) {
    // ... (This function remains the same as your original)
    const subjectSelect = document.getElementById(subjectSelectId);
    const chapterSelect = document.getElementById(chapterSelectId);
    const selectedSubject = subjectSelect.value;

    chapterSelect.innerHTML = `<option disabled selected>${t('select_chapter')}</option>`; // Reset
    chapterSelect.disabled = true;

    if (selectedSubject && chapters[selectedSubject]) {
        chapters[selectedSubject].forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = chapter.name.english;
            option.textContent = `${t('chapter')} ${index + 1}: ${ts(chapter.name)}`;
            chapterSelect.appendChild(option);
        });
        chapterSelect.disabled = false;
    }
}

function handlePdfUpload(event) {
    // ... (This function remains the same as your original)
    const file = event.target.files[0];
    if (!file) return;
    const subject = document.getElementById('upload-subject-select').value;
    const chapter = document.getElementById('upload-chapter-select').value;
    const isAssignment = document.getElementById('doc-type-assignment').checked;
    if (!subject || subject === t('select_subject') || !chapter || chapter === t('select_chapter')) {
        alert('Please select a subject and chapter first.');
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileUrl = e.target.result;
        const targetObject = isAssignment ? assignments : chapterNotes;
        const docTypeName = isAssignment ? 'Assignment' : 'Class Notes';
        if (!targetObject[subject]) targetObject[subject] = {};
        if (!targetObject[subject][chapter]) targetObject[subject][chapter] = [];
        targetObject[subject][chapter].push({ fileName: file.name, fileUrl: fileUrl });
        alert(`${docTypeName} '${file.name}' uploaded successfully for ${subject} - ${chapter}!`);
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function handleVideoUpload(event) {
    // ... (This function remains the same as your original)
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert("Warning: This video file is large and may make the app unstable. Please use smaller video clips.");
    }
    const subject = document.getElementById('upload-subject-select').value;
    const chapter = document.getElementById('upload-chapter-select').value;
    if (!subject || subject === t('select_subject') || !chapter || chapter === t('select_chapter')) {
        alert('Please select a subject and chapter first.');
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileUrl = e.target.result;
        if (!videoLessons[subject]) videoLessons[subject] = {};
        if (!videoLessons[subject][chapter]) videoLessons[subject][chapter] = [];
        videoLessons[subject][chapter].push({ fileName: file.name, fileUrl: fileUrl });
        saveContentToLocalStorage();
        alert(`Video '${file.name}' was uploaded successfully!`);
        event.target.value = '';
    };
    alert("Processing video... please wait. This may take a moment for larger files.");
    reader.readAsDataURL(file);
}

function saveContentToLocalStorage() {
    // ... (This function remains the same as your original)
    const contentToSave = { videoLessons, chapterNotes, assignments };
    localStorage.setItem('naviKalamContent', JSON.stringify(contentToSave));
}


// --- CORE RENDERING FUNCTIONS (UPDATED) ---

export async function showTeacherContent(contentId) { // Now async
    state.setCurrentTeacherContent(contentId);
    let content = '';
    toggleStudentActionsDropdown(null, null);

    document.querySelectorAll('#teacher-bottom-nav .nav-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-500', 'dark:text-gray-400');
    });
    
    document.querySelector("#teacher-bottom-nav button[onclick*='uploads']").id = 'nav-teacher-uploads';
    document.querySelector("#teacher-bottom-nav button[onclick*='toggleAddStudentModal']").id = 'nav-teacher-add';

    const activeBtnQuery = contentId === 'uploads' ? "[onclick*='showTeacherContent(\\'uploads\\')']" : `[onclick*="'${contentId}'"]`;
    const activeBtn = document.querySelector(`#teacher-bottom-nav .nav-button${activeBtnQuery}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
    }
    
    if (contentId === 'progress') {
        content = await renderProgressContent(); // Now awaits the content
    } else if (contentId === 'uploads') {
        content = renderUploadsContent();
    } else if (contentId === 'attendance') {
        content = renderAttendanceContent();
        setTimeout(() => {
            const datePicker = document.getElementById('attendance-date-picker');
            datePicker.value = getTodayDateString();
            renderAttendanceSheet(datePicker.value);
            datePicker.onchange = () => renderAttendanceSheet(datePicker.value);
        }, 0);
    } else if (contentId === 'timetable') {
        content = renderTimetableContent();
        setTimeout(() => renderTimetable(), 0);
    } else if (contentId === 'settings') {
        content = renderSettingsContent();
    }

    const mainContentEl = document.getElementById('teacher-main-content');
    if (mainContentEl) mainContentEl.innerHTML = content;

    if (contentId === 'uploads') {
        document.getElementById('video-upload-input')?.addEventListener('change', handleVideoUpload);
        document.getElementById('upload-file-input')?.addEventListener('change', handlePdfUpload);
        document.getElementById('upload-subject-select')?.addEventListener('change', () => populateChapterSelect('upload-subject-select', 'upload-chapter-select'));
    }
}

async function renderProgressContent() {
    const subjectOverview = renderSubjectOverview();
    const studentList = await renderStudentList(); // Await the list from Firestore

    return `
        <div class="slide-up">
            ${subjectOverview}
            <h3 id="teacher-progress-title" class="text-xl font-bold text-gray-800 dark:text-white mb-4 border-t pt-4 mt-6 dark:border-gray-700">${t('student_progress')}</h3>
            <div id="teacher-student-list" class="space-y-3">${studentList}</div>
        </div>
    `;
}

/**
 * UPDATED: This function now fetches the list of students from Firestore.
 */
async function renderStudentList() {
    if (!db) return '<p>Database not connected.</p>';

    const students = [];
    const q = query(collection(db, "users"), where("role", "==", "student"));

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            students.push({ id: doc.id, ...doc.data() });
        });
        
        studentCache = students; // Save the fetched students to our local cache

        if (students.length === 0) {
            return `<p class="text-center text-gray-500 dark:text-gray-400">No students found in the database.</p>`;
        }

        return students.map((student, index) => {
            // Dummy progress for now, this would also come from Firestore in a real app
            const overallProgress = Math.floor(Math.random() * 101);
            return `
                <div id="student-card-${index}" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm flex items-center space-x-4">
                    <img src="./assets/${student.avatar}.svg" class="w-12 h-12 rounded-full cursor-pointer" alt="${student.name}'s avatar" onclick="showStudentDetails('${student.id}')">
                    <div class="flex-1 cursor-pointer" onclick="showStudentDetails('${student.id}')">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-bold text-gray-800 dark:text-white">${student.name}</h4>
                            <span class="text-sm font-semibold ${overallProgress < 30 ? 'text-red-500' : 'text-green-500'}">${overallProgress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div class="${overallProgress < 30 ? 'bg-red-500' : 'bg-green-500'} h-2.5 rounded-full" style="width: ${overallProgress}%"></div>
                        </div>
                    </div>
                    <button id="student-actions-button-${index}" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2" onclick="toggleStudentActionsDropdown(event, '${student.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error fetching students: ", error);
        return `<p class="text-center text-red-500">Could not load students.</p>`;
    }
}

/**
 * UPDATED: Fetches test history for a student from Firestore.
 */
export async function showStudentDetails(studentId) {
    const student = studentCache.find(s => s.id === studentId);
    if (!student) {
        alert("Student not found!");
        return;
    }

    document.getElementById('details-student-avatar').src = `./assets/${student.avatar}.svg`;
    document.getElementById('details-student-name').innerText = student.name;

    const subjectListContainer = document.getElementById('details-subject-list');
    
    // This part for progress bars remains the same for now
    const subjectProgressHtml = subjects.map(subjectInfo => {
        const progress = student.progress ? student.progress[subjectInfo.name.english] || 0 : 0;
        return `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div class="flex items-center space-x-3">
                    <div class="bg-${subjectInfo.color}-100 dark:bg-${subjectInfo.color}-900/50 w-12 h-12 rounded-lg flex items-center justify-center">
                        <i class="fas ${subjectInfo.icon} text-2xl text-${subjectInfo.color}-500"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-bold text-gray-800 dark:text-white">${ts(subjectInfo.name)}</h4>
                            <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">${progress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-${subjectInfo.color}-500 h-2 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    // --- NEW FIREBASE LOGIC TO FETCH TEST HISTORY ---
    let historyHtml = `<div class="mt-6"><h4 class="text-lg font-bold text-gray-800 dark:text-white mb-3">Recent Test Reports</h4>`;
    const history = [];

    try {
        const q = query(
            collection(db, "testResults"), 
            where("studentId", "==", studentId), 
            orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
        });
        currentStudentTestHistory = history; // Cache the fetched history
    } catch (error) {
        console.error("Error fetching test history: ", error);
        historyHtml += `<p class="text-red-500">Could not load test history.</p>`;
    }
    // --- END OF FIREBASE LOGIC ---

    if (history.length > 0) {
        historyHtml += `<div class="space-y-3">` + history.map((test, index) => {
            const chapterObj = chapters[test.subject]?.find(c => c.name.english === test.chapter);
            const chapterName = chapterObj ? ts(chapterObj.name) : test.chapter;
            const subjectObj = subjects.find(s => s.name.english === test.subject);
            const subjectName = subjectObj ? ts(subjectObj.name) : test.subject;
            const scoreColor = (test.score / test.totalQuestions) >= 0.5 ? 'text-green-500' : 'text-red-500';
            const testDate = test.date ? test.date.toDate().toLocaleString() : 'No date';

            return `<div class="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onclick="showTestReportDetails('${student.id}', ${index})">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-gray-800 dark:text-white">${subjectName} - ${chapterName}</p>
                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${testDate}</p>
                            </div>
                            <p class="font-bold text-lg ${scoreColor}">${test.score}/${test.totalQuestions}</p>
                        </div>
                         <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right font-semibold">Click to see details</p>
                    </div>`;
        }).join('') + `</div>`;
    } else {
        historyHtml += `<div class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p class="text-gray-500 dark:text-gray-400">No test history available for this student.</p>
        </div>`;
    }
    historyHtml += '</div>';
    
    subjectListContainer.innerHTML = subjectProgressHtml + historyHtml;
    showScreen('studentDetails');
}

/**
 * UPDATED: This function now reads from the cached test history.
 */
export function showTestReportDetails(studentId, testIndex) {
    const test = currentStudentTestHistory[testIndex]; // Use the cached history
    if (!test) return;
    const modal = document.getElementById('test-report-modal');
    if (!modal) return;
    
    const subjectObj = subjects.find(s => s.name.english === test.subject);
    const subjectName = subjectObj ? ts(subjectObj.name) : test.subject;
    const chapterObj = chapters[test.subject]?.find(c => c.name.english === test.chapter);
    const chapterName = chapterObj ? ts(chapterObj.name) : test.chapter;
    const totalTime = test.detailedResults.reduce((sum, result) => sum + result.timeTaken, 0);
    const averageTime = (totalTime / test.totalQuestions).toFixed(2);

    document.getElementById('report-subject').innerText = subjectName;
    document.getElementById('report-chapter').innerText = chapterName;
    document.getElementById('report-score').innerText = `${test.score} / ${test.totalQuestions}`;
    document.getElementById('report-total-time').innerText = `${totalTime.toFixed(2)}s`;
    document.getElementById('report-avg-time').innerText = `${averageTime}s`;
    
    const breakdownList = document.getElementById('report-breakdown-list');
    breakdownList.innerHTML = test.detailedResults.map((result, index) => {
        let statusText, bgColor;
        if (result.skipped) { statusText = 'Skipped'; bgColor = 'bg-yellow-100 dark:bg-yellow-900/50'; }
        else if (result.isCorrect) { statusText = 'Correct'; bgColor = 'bg-green-100 dark:bg-green-900/50'; }
        else { statusText = 'Incorrect'; bgColor = 'bg-red-100 dark:bg-red-900/50'; }
        return `<div class="p-2.5 rounded-lg text-sm ${bgColor} text-gray-800 dark:text-gray-200"><strong>Q${index + 1}:</strong> Took ${result.timeTaken}s - ${statusText}</div>`;
    }).join('');
    modal.classList.remove('hidden');
}

/**
 * UPDATED: This function now adds a new student to the Firestore database.
 */
export async function addNewStudent() {
    const nameInput = document.getElementById('new-student-name-input');
    const studentName = nameInput.value.trim();
    if (!studentName || !newStudentAvatar) {
        alert("Please provide a name and select an avatar.");
        return;
    }

    // In a real app, you would create an auth user first and use their UID.
    // For now, we'll create a profile with a placeholder email.
    const newStudentData = {
        name: studentName,
        avatar: newStudentAvatar,
        role: "student",
        email: `${studentName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
        classId: "class_8", // Default class
        progress: subjects.reduce((acc, subject) => ({ ...acc, [subject.name.english]: 0 }), {})
    };

    try {
        const docRef = await addDoc(collection(db, "users"), newStudentData);
        console.log("New student added with ID: ", docRef.id);
        toggleAddStudentModal(false);
        await showTeacherContent('progress'); // Refresh the view
    } catch (error) {
        console.error("Error adding student: ", error);
        alert("Could not add the student to the database.");
    }
}


// --- UNCHANGED FUNCTIONS ---
// (The rest of your functions like renderUploadsContent, toggleStudentActionsDropdown, attendance, timetable, etc., remain the same for now)

export function toggleStudentActionsDropdown(event, studentId) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('student-actions-dropdown');
    if (!dropdown) return;
    if (activeStudentDropdown === studentId) {
        dropdown.classList.add('hidden');
        activeStudentDropdown = null;
    } else if (studentId) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const containerRect = document.getElementById('teacher-dashboard-screen').getBoundingClientRect();
        dropdown.style.top = `${rect.bottom - containerRect.top}px`;
        dropdown.classList.remove('hidden');
        activeStudentDropdown = studentId;
    } else {
        dropdown.classList.add('hidden');
        activeStudentDropdown = null;
    }
}

window.addEventListener('click', () => {
    if (activeStudentDropdown) {
        toggleStudentActionsDropdown(null, null);
    }
}, true);

export function toggleAddStudentModal(show) {
    const modal = document.getElementById('add-student-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('new-student-name-input').value = '';
        newStudentAvatar = null;
        document.querySelectorAll('.new-avatar-option').forEach(el => {
            el.classList.remove('ring-4', 'ring-teal-500', 'opacity-100');
            el.classList.add('opacity-60');
        });
    }
}

export function selectNewStudentAvatar(avatarId, element) {
    newStudentAvatar = avatarId;
    document.querySelectorAll('.new-avatar-option').forEach(el => {
        el.classList.remove('ring-4', 'ring-teal-500', 'opacity-100');
        el.classList.add('opacity-60');
    });
    element.classList.add('ring-4', 'ring-teal-500', 'opacity-100');
    element.classList.remove('opacity-60');
}

function getTodayDateString() { return new Date().toISOString().split('T')[0]; }

function renderAttendanceContent() {
    return `
        <div class="slide-up">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">${t('mark_attendance')}</h3>
                <input type="date" id="attendance-date-picker" class="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 text-sm">
            </div>
            <div id="attendance-student-list" class="space-y-3"></div>
        </div>
    `;
}

function renderAttendanceSheet(dateString) {
    const studentListContainer = document.getElementById('attendance-student-list');
    const todaysRecords = attendanceRecords[dateString] || {};
    // This still uses the local cache, which is fine for UI rendering
    studentListContainer.innerHTML = studentCache.map(student => {
        const status = todaysRecords[student.id] || '';
        return `
            <div class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="./assets/${student.avatar}.svg" class="w-10 h-10 rounded-full" alt="${student.name}'s avatar">
                    <h4 class="font-bold text-gray-800 dark:text-white">${student.name}</h4>
                </div>
                <div class="flex space-x-2">
                    <button onclick="markStudent(this, '${student.id}', 'present', '${dateString}')" class="attendance-btn ${status === 'present' ? 'present' : 'bg-gray-200 dark:bg-gray-600'} w-24 py-2 font-semibold rounded-lg transition-colors">${t('present')}</button>
                    <button onclick="markStudent(this, '${student.id}', 'absent', '${dateString}')" class="attendance-btn ${status === 'absent' ? 'absent' : 'bg-gray-200 dark:bg-gray-600'} w-24 py-2 font-semibold rounded-lg transition-colors">${t('absent')}</button>
                </div>
            </div>
        `;
    }).join('');
}

export function markStudent(buttonElement, studentId, status, dateString) {
    if (!attendanceRecords[dateString]) attendanceRecords[dateString] = {};
    attendanceRecords[dateString][studentId] = status;
    const parent = buttonElement.parentElement;
    parent.querySelectorAll('.attendance-btn').forEach(btn => btn.classList.remove('present', 'absent'));
    parent.querySelector(`[onclick*="'present'"]`).classList.add(status === 'present' ? 'present' : 'bg-gray-200', 'dark:bg-gray-600');
    parent.querySelector(`[onclick*="'absent'"]`).classList.add(status === 'absent' ? 'absent' : 'bg-gray-200', 'dark:bg-gray-600');
}

function renderTimetableContent() {
    return `
        <div class="slide-up">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">${t('class_timetable')}</h3>
                <button onclick="toggleEditTimetableModal(true)" class="text-sm bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg flex items-center space-x-2 shadow-sm hover:bg-blue-600"><i class="fas fa-edit"></i><span>${t('edit')}</span></button>
            </div>
            <div id="timetable-grid"></div>
        </div>
    `;
}

function renderTimetable() {
    const container = document.getElementById('timetable-grid');
    if (!container) return;
    let html = '<div class="timetable-grid-container">';
    html += `<div class="timetable-header">Time</div>`;
    daysOfWeek.forEach(day => html += `<div class="timetable-header">${day}</div>`);
    for (const time in timetableData) {
        html += `<div class="timetable-time">${time}</div>`;
        timetableData[time].forEach(subject => {
            html += `<div class="timetable-slot">${subject || '-'}</div>`;
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

export function renderTimetableForStudent() {
    let html = '<div class="timetable-grid-container">';
    html += `<div class="timetable-header">Time</div>`;
    daysOfWeek.forEach(day => html += `<div class="timetable-header">${day}</div>`);
    for (const time in timetableData) {
        html += `<div class="timetable-time">${time}</div>`;
        timetableData[time].forEach(subject => {
            html += `<div class="timetable-slot">${subject || '-'}</div>`;
        });
    }
    html += '</div>';
    return html;
}

export function toggleEditTimetableModal(show) {
    const modal = document.getElementById('edit-timetable-modal');
    const form = document.getElementById('edit-timetable-form');
    if (show) {
        let formHtml = '';
        for (const time in timetableData) {
            formHtml += `<div class="border-b dark:border-gray-600 pb-3 mb-3"><p class="font-bold mb-2 text-gray-800 dark:text-white">${time}</p><div class="grid grid-cols-3 gap-2">`;
            daysOfWeek.forEach((day, index) => {
                const currentSubject = timetableData[time][index] || '';
                formHtml += `<div><label class="text-xs text-gray-500 dark:text-gray-400">${day}</label><input type="text" data-time="${time}" data-day="${index}" value="${currentSubject}" class="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"></div>`;
            });
            formHtml += `</div></div>`;
        }
        form.innerHTML = formHtml;
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

export function saveTimetable() {
    const inputs = document.querySelectorAll('#edit-timetable-form input');
    inputs.forEach(input => {
        const time = input.dataset.time;
        const dayIndex = parseInt(input.dataset.day, 10);
        timetableData[time][dayIndex] = input.value;
    });
    toggleEditTimetableModal(false);
    showTeacherContent('timetable');
}

export function closeTestReportModal() {
    const modal = document.getElementById('test-report-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderSubjectOverview() {
    const overviewHtml = subjects.map(subject => {
        const subjectName = subject.name.english;
        const notesCount = Object.values(chapterNotes[subjectName] || {}).flat().length;
        const assignmentsCount = Object.values(assignments[subjectName] || {}).flat().length;
        const videoCount = Object.values(videoLessons[subjectName] || {}).flat().length;
        return `
            <div onclick="showContentDetails('${subjectName}')" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm flex items-center space-x-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all">
                <div class="bg-${subject.color}-100 dark:bg-${subject.color}-900/50 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas ${subject.icon} text-2xl text-${subject.color}-500"></i>
                </div>
                <div class="flex-1 pointer-events-none">
                    <h4 class="font-bold text-gray-800 dark:text-white">${ts(subject.name)}</h4>
                    <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span title="${videoCount} ${t('videos')} uploaded"><i class="fas fa-video mr-1 text-red-500"></i> ${videoCount}</span>
                        <span title="${notesCount} ${t('notes')} uploaded"><i class="fas fa-file-alt mr-1 text-blue-500"></i> ${notesCount}</span>
                        <span title="${assignmentsCount} ${t('assignments')} posted"><i class="fas fa-tasks mr-1 text-amber-500"></i> ${assignmentsCount}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
    return `
        <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${t('content_overview')}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${overviewHtml}</div>
        </div>`;
}

function renderUploadsContent() {
    return `
        <div class="slide-up">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${t('teacher_uploads_tab')}</h3>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
                <form id="upload-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1. Select Topic</label>
                        <select id="upload-subject-select" class="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            <option disabled selected>${t('select_subject')}</option>
                            ${subjects.map(s => `<option value="${s.name.english}">${ts(s.name)}</option>`).join('')}
                        </select>
                        <select id="upload-chapter-select" class="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 mt-2" disabled>
                            <option disabled selected>${t('select_chapter')}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2. Choose File to Upload</label>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="video-upload-input" class="w-full text-center cursor-pointer bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 font-bold py-4 px-2 rounded-lg border-2 border-dashed border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900 block">
                                    <i class="fas fa-video text-2xl mb-1"></i><br>Video Lesson
                                </label>
                                <input type="file" id="video-upload-input" class="hidden" accept="video/*">
                            </div>
                            <div>
                                <label for="upload-file-input" class="w-full text-center cursor-pointer bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold py-4 px-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900 block">
                                    <i class="fas fa-file-pdf text-2xl mb-1"></i><br>Notes / Assignment
                                </label>
                                <input type="file" id="upload-file-input" class="hidden" accept=".pdf">
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3. Select Document Type (for PDF)</label>
                        <div class="flex items-center space-x-6 mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" id="doc-type-notes" name="docType" value="notes" class="form-radio h-4 w-4 text-teal-600" checked>
                                <span class="ml-2 text-gray-700 dark:text-gray-200">Class Notes</span>
                            </label>
                            <label class="flex items-center cursor-pointer">
                                <input type="radio" id="doc-type-assignment" name="docType" value="assignment" class="form-radio h-4 w-4 text-teal-600">
                                <span class="ml-2 text-gray-700 dark:text-gray-200">Assignment</span>
                            </label>
                        </div>
                    </div>
                    <div id="upload-progress-container" class="pt-2 hidden">
                         <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div id="upload-progress-bar" class="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                        <p id="upload-status-text" class="text-xs text-center mt-1 text-gray-500 dark:text-gray-400"></p>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderSettingsContent() {
    const htmlEl = document.documentElement;
    return `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('settings')}</h3>
        <div class="slide-up bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm space-y-2">
            <div class="flex justify-between items-center p-2">
                <span class="text-gray-800 dark:text-white"><i class="fas fa-palette w-6 mr-2 text-gray-500 dark:text-gray-400"></i> ${t('dark_theme')}</span>
                <div class="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" onchange="toggleTheme()" id="teacher-theme-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${htmlEl.classList.contains('dark') ? 'checked' : ''}/>
                    <label for="teacher-theme-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                </div>
            </div>
            <div class="flex justify-between items-center p-2">
                <span class="text-gray-800 dark:text-white"><i class="fas fa-desktop w-6 mr-2 text-gray-500 dark:text-gray-400"></i> ${t('website_view')}</span>
                <div class="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" onchange="toggleViewMode()" id="teacher-view-mode-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${localStorage.getItem('viewMode') === 'website' ? 'checked' : ''}/>
                    <label for="teacher-view-mode-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                </div>
            </div>
        </div>
        <div class="slide-up bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm mt-4" style="animation-delay: 100ms;">
            <div class="flex justify-between items-center p-2">
                <span class="text-gray-800 dark:text-white"><i class="fas fa-language w-6 mr-2 text-gray-500 dark:text-gray-400"></i> ${t('language')}</span>
                <div class="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                    <button onclick="changeLanguage('english')" class="lang-button ${state.currentLanguage === 'english' ? 'bg-white dark:bg-gray-800 text-teal-500' : 'text-gray-500 dark:text-gray-400'} font-semibold py-1 px-3 rounded-md transition-colors text-sm">English</button>
                    <button onclick="changeLanguage('punjabi')" class="lang-button ${state.currentLanguage === 'punjabi' ? 'bg-white dark:bg-gray-800 text-teal-500' : 'text-gray-500 dark:text-gray-400'} font-semibold py-1 px-3 rounded-md transition-colors text-sm">ਪੰਜਾਬੀ</button>
                    <button onclick="changeLanguage('hindi')" class="lang-button ${state.currentLanguage === 'hindi' ? 'bg-white dark:bg-gray-800 text-teal-500' : 'text-gray-500 dark:text-gray-400'} font-semibold py-1 px-3 rounded-md transition-colors text-sm">हिन्दी</button>
                </div>
            </div>
        </div>`;
}

export function showContentDetails(subjectEngName) {
    const subject = subjects.find(s => s.name.english === subjectEngName);
    if (!subject) return;

    const subjectChapters = chapters[subjectEngName] || [];
    const subjectNotes = chapterNotes[subjectEngName] || {};
    const subjectAssignments = assignments[subjectEngName] || {};
    const subjectVideos = videoLessons[subjectEngName] || {};

    let contentHtml = subjectChapters.map(chapter => {
        const chapterEngName = chapter.name.english;
        const notesForChapter = subjectNotes[chapterEngName] || [];
        const assignmentsForChapter = subjectAssignments[chapterEngName] || [];
        const videosForChapter = subjectVideos[chapterEngName] || [];

        if (notesForChapter.length === 0 && assignmentsForChapter.length === 0 && videosForChapter.length === 0) {
            return '';
        }

        return `
            <div class="mb-4">
                <h4 class="font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-600 pb-1 mb-2">${ts(chapter.name)}</h4>
                <div class="space-y-2">
                    ${videosForChapter.map(video => `
                        <div class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg flex items-center justify-between">
                            <span class="flex items-center text-sm"><i class="fas fa-video text-red-500 mr-3"></i>${video.fileName}</span>
                        </div>
                    `).join('')}
                    ${notesForChapter.map(note => `
                        <div class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg flex items-center justify-between">
                            <span class="flex items-center text-sm"><i class="fas fa-file-alt text-blue-500 mr-3"></i>${note.fileName}</span>
                            <button onclick="openNotesViewer('${note.fileUrl}', '${note.fileName}')" class="text-xs bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600">View</button>
                        </div>
                    `).join('')}
                    ${assignmentsForChapter.map(assignment => `
                        <div class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg flex items-center justify-between">
                            <span class="flex items-center text-sm"><i class="fas fa-tasks text-amber-500 mr-3"></i>${assignment.fileName}</span>
                            <button onclick="openNotesViewer('${assignment.fileUrl}', '${assignment.fileName}')" class="text-xs bg-amber-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-amber-600">View</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (!contentHtml) {
        contentHtml = `<p class="text-center text-gray-500 dark:text-gray-400 mt-4">No content (videos, notes, or assignments) has been uploaded for this subject yet.</p>`;
    }

    const fullPageHtml = `
        <div class="slide-up">
            <button onclick="showTeacherContent('progress')" class="text-teal-500 font-semibold mb-4">&larr; Back to Dashboard</button>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('content_details_for')} ${ts(subject.name)}</h3>
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                ${contentHtml}
            </div>
        </div>
    `;

    document.getElementById('teacher-main-content').innerHTML = fullPageHtml;
}