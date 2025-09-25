// This file handles all general UI rendering, screen transitions, and DOM manipulations.

import * as state from './state.js';
import { subjects, chapters, attendanceRecords, assignments, syllabusData, lessonContent, chapterNotes,inbuiltContent , videoLessons} from './data.js';
import { t, ts } from './main.js';
import { loadDoubtForum } from './firebase.js';
import { initCanvas } from './whiteboard.js';
import { renderTestSubjectSelection } from './practiceTest.js';
import { renderTimetableForStudent } from './teacher.js';

// --- DOM ELEMENT REFERENCES ---
export const screens = {
    splash: document.getElementById('splash-screen'),
    language: document.getElementById('language-screen'),
    role: document.getElementById('role-screen'),
    studentLogin: document.getElementById('student-login-screen'),
    teacherLogin: document.getElementById('teacher-login-screen'),
    main: document.getElementById('main-app'),
    chapterList: document.getElementById('chapter-list-screen'),
    lesson: document.getElementById('lesson-screen'),
    whiteboard: document.getElementById('whiteboard-screen'),
    practiceTest: document.getElementById('practice-test-screen'),
    doubtForum: document.getElementById('doubt-forum-screen'),
    showcase: document.getElementById('showcase-screen'),
    teacherDashboard: document.getElementById('teacher-dashboard-screen'),
    studentDetails: document.getElementById('student-details-screen'),
    studentSignup: document.getElementById('student-signup-screen'),
    teacherSignup: document.getElementById('teacher-signup-screen'),
    sync: document.getElementById('sync-screen')
};
const mainContentContainer = document.getElementById('app-main-content');
const sideMenu = document.getElementById('side-menu');
const menuOverlay = document.getElementById('menu-overlay');
const teacherSideMenu = document.getElementById('teacher-side-menu');
const teacherMenuOverlay = document.getElementById('teacher-menu-overlay');
const htmlEl = document.documentElement;
const celebrationColors = ['#0D9488', '#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

/**
 * (Frontend-only) Fetches rewards data for a student from local storage.
 * @param {string} studentId The ID of the student.
 * @returns {object} An object with totalPoints and badges.
 */
function getStudentRewards(studentId) {
    if (!studentId) return { totalPoints: 0, badges: [] };

    const rewardsKey = `naviKalamRewards_${studentId}`;
    const rewardsData = JSON.parse(localStorage.getItem(rewardsKey));

    if (rewardsData) {
        return rewardsData;
    } else {
        // Return a default structure if no rewards data exists yet
        return { totalPoints: 0, badges: [] };
    }
}

export function showScreen(screenId) {
    if (state.unsubscribeDoubtListener) {
        state.unsubscribeDoubtListener();
        state.setUnsubscribeDoubtListener(null);
    }
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenId]) {
        screens[screenId].classList.add('active', 'fade-in');
        if (screenId === 'whiteboard') initCanvas();
        if (screenId === 'doubtForum') loadDoubtForum();
        if (screenId === 'practiceTest') renderTestSubjectSelection();
    }
}

export function toggleMenu() {
    sideMenu.classList.toggle('-translate-x-full');
    menuOverlay.classList.toggle('opacity-0');
    menuOverlay.classList.toggle('pointer-events-none');
}

export function toggleTeacherMenu() {
    teacherSideMenu.classList.toggle('-translate-x-full');
    teacherMenuOverlay.classList.toggle('opacity-0');
    teacherMenuOverlay.classList.toggle('pointer-events-none');
}

export function updateStaticUIText() {
    const setText = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.innerText = t(key);
    };
    const setPlaceholder = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = t(key);
    };
    setText('role_screen_title', 'who_are_you');
    setText('role_student_title', 'student');
    setText('role_teacher_title', 'teacher');
    setText('student_login_title', 'student_login');
    setPlaceholder('student-email-input', 'your_name');
    setText('select_class_option', 'select_class');
    setText('class_5_option', 'class_5');
    setText('class_6_option', 'class_6');
    setText('class_7_option', 'class_7');
    setText('class_8_option', 'class_8');
    setPlaceholder('student-password-input', 'pin_placeholder');
    setText('student_login_button', 'lets_go');
    setText('teacher_login_title', 'teacher_login');
    setPlaceholder('teacher-email-input', 'school_id');
    setPlaceholder('teacher-password-input', 'password');
    setText('teacher_login_button', 'login');
    setText('main_app_title', 'app_title');
    const studentSyncStatus = document.querySelector('#main-app #sync_status_text');
    if (studentSyncStatus) studentSyncStatus.innerText = t('synced');
    const teacherSyncStatus = document.querySelector('#teacher-dashboard-screen #teacher_sync_status_text');
    if (teacherSyncStatus) teacherSyncStatus.innerText = t('synced');
    setText('nav_home_text', 'home');
    setText('nav_learn_text', 'learn');
    setText('nav_practice_text', 'practice');
    setText('nav_rewards_text', 'rewards');
    setText('menu_profile_text', 'profile');
    setText('menu_syllabus_text', 'syllabus');
    setText('menu_timetable_text', 'timetable');
    setText('menu_attendance_text', 'attendance');
    setText('menu_settings_text', 'settings');
    setText('menu_offline_text', 'offline_manager');
    setText('menu_guide_text', 'guide');
    setText('menu_logout_text', 'log_out');
    setText('doubt_forum_button_text', 'doubt_forum');
    setText('lesson_tab_lesson', 'lesson');
    setText('lesson_tab_summary', 'summary');
    setText('lesson_tab_quiz', 'quiz');
    setText('whiteboard_title_text', 'whiteboard_title');
    setText('whiteboard_close_button', 'close');
    setText('ask_question_button', 'ask_new_question');
    setText('showcase_title_text', 'community_showcase');
    setText('work_of_week_title_text', 'work_of_the_week');
    setText('example_drawing_title_text', 'example_drawing_title');
    setText('example_drawing_author_text', 'example_drawing_author');
    setText('teacher_dashboard_title', 'teacher_dashboard');
    setText('details_student_subtitle', 'student_progress_subtitle');
    setText('edit_timetable_modal_title', 'edit_timetable');
    setText('modal_cancel_button', 'cancel');
    setText('modal_save_button', 'save_changes');
    setText('ask_question_modal_title', 'ask_new_question');
    setPlaceholder('question-textarea', 'type_question_placeholder');
    setText('ask_question_cancel_button', 'cancel');
    setText('ask_question_submit_button', 'submit');
    setText('add_student_modal_title', 'add_new_student');
    setPlaceholder('new-student-name-input', 'student_name_placeholder');
    setText('choose_avatar_title_text', 'choose_avatar_title');
    setText('add_student_cancel_button', 'cancel');
    setText('add_student_add_button', 'add_student');
    setText('guide_skip_button', 'skip_tour');
    setText('guide_next_button', 'next');
    document.querySelectorAll('.teacher-nav-progress-text').forEach(el => el.innerText = t('teacher_nav_progress'));
    document.querySelectorAll('.teacher-nav-add-text').forEach(el => el.innerText = t('teacher_nav_add'));
    document.querySelectorAll('.teacher-nav-attendance-text').forEach(el => el.innerText = t('teacher_nav_attendance'));
    document.querySelectorAll('.teacher-nav-timetable-text').forEach(el => el.innerText = t('teacher_nav_timetable'));
    setText('teacher_menu_settings_text', 'teacher_settings');
    setText('teacher_menu_guide_text', 'teacher_guide');
    setText('teacher_menu_logout_text', 'log_out');
}

export function showMainContent(contentId) {
    state.setCurrentMainContent(contentId);
    let content = '';
    document.querySelectorAll('#bottom-nav .nav-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-500', 'dark:text-gray-400');
    });
    const activeBtn = document.querySelector(`#bottom-nav .nav-button[onclick*="'${contentId}'"]`);
    if (activeBtn) {
         activeBtn.classList.add('active');
         activeBtn.classList.remove('text-gray-500', 'dark:text-gray-400');
    }
    
    if (contentId === 'home') {
        content = `
            <div class="slide-up" style="animation-delay: 100ms;"><h3 class="text-xl font-bold text-gray-800 dark:text-white mb-3">${t('todays_focus')}</h3><div class="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar"><div class="flex-shrink-0 w-52 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"><div class="flex items-center"><i class="fas fa-check-circle text-green-500 text-xl mr-3"></i><div><p class="font-semibold text-gray-800 dark:text-white">${t('complete_1_quiz')}</p><p class="text-xs text-gray-500 dark:text-gray-400">${t('10_points')}</p></div></div></div><div class="flex-shrink-0 w-52 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"><div class="flex items-center"><i class="far fa-circle text-gray-400 text-xl mr-3"></i><div><p class="font-semibold text-gray-800 dark:text-white">${t('learn_15_mins')}</p><p class="text-xs text-gray-500 dark:text-gray-400">${t('20_points')}</p></div></div></div></div></div>
            <div onclick="showScreen('showcase')" class="slide-up mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 rounded-xl shadow-md flex items-center justify-between cursor-pointer transition-transform duration-200 hover:scale-105"><div class="flex items-center"><i class="fas fa-star text-2xl mr-3"></i><div><p class="font-bold">${t('community_showcase')}</p><p class="text-xs">${t('work_of_the_week')}</p></div></div><i class="fas fa-chevron-right"></i></div>
            <div class="slide-up mt-6" style="animation-delay: 200ms;"><h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${t('your_subjects')}</h3>
            <div id="subject-cards" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${subjects.map(s => `<div onclick="showChapterList('${s.name.english}')" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"><div class="flex items-center justify-between mb-3"><div class="bg-${s.color}-100 dark:bg-${s.color}-900/50 w-12 h-12 rounded-full flex items-center justify-center"><i class="fas ${s.icon} text-2xl text-${s.color}-500"></i></div><span class="font-bold text-gray-700 dark:text-gray-300">${s.progress}%</span></div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${ts(s.name)}</h4><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2"><div class="bg-${s.color}-500 h-1.5 rounded-full" style="width: ${s.progress}%"></div></div></div>`).join('')}</div></div>`;
    } else if (contentId === 'learn') {
        content = `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('learning_map')}</h3><div class="learning-map p-4 rounded-lg"><div class="space-y-8">${subjects.map((s,i) => `<div onclick="showChapterList('${s.name.english}')" class="slide-up bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all" style="animation-delay: ${i*100}ms"><div class="bg-${s.color}-100 dark:bg-${s.color}-900/50 w-16 h-16 rounded-lg flex items-center justify-center"><i class="fas ${s.icon} text-3xl text-${s.color}-500"></i></div><div><h4 class="font-bold text-xl text-gray-800 dark:text-white">${ts(s.name)}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${(chapters[s.name.english] || []).length} ${t('chapters')}</p></div></div>`).join('')}</div></div>`;
    } else if (contentId === 'practice') {
        content = `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('practice_zone')}</h3>
        <div id="whiteboard-card" onclick="showScreen('whiteboard')" class="slide-up bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-palette text-2xl text-purple-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('whiteboard_title')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('whiteboard_subtitle')}</p></div></div>
        <div class="slide-up mt-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-camera text-2xl text-cyan-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('object_explorer_title')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('object_explorer_subtitle')}</p></div></div>
        <div id="take-a-test-card" onclick="showScreen('practiceTest')" class="slide-up mt-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-file-alt text-2xl text-teal-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('take_a_test_title')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('take_a_test_subtitle')}</p></div></div>
        
        <div class="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700 border-dashed">
            <div id="inbuilt-notes-card" onclick="showInbuiltContent('notes')" class="slide-up mt-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-book-reader text-2xl text-blue-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('inbuilt_notes')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('notes_subtitle')}</p></div></div>
            <div id="inbuilt-assignment-card" onclick="showInbuiltContent('assignment')" class="slide-up mt-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-pencil-alt text-2xl text-amber-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('inbuilt_assignments')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('assignments_subtitle')}</p></div></div>
            <div id="inbuilt-solution-card" onclick="showInbuiltContent('assignmentSolution')" class="slide-up mt-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-4 transition-all duration-200 hover:shadow-md"><i class="fas fa-check-double text-2xl text-green-500"></i><div><h4 class="font-bold text-lg text-gray-800 dark:text-white">${t('assignment_solutions')}</h4><p class="text-sm text-gray-500 dark:text-gray-400">${t('solutions_subtitle')}</p></div></div>
        </div>
        `;
    } else if (contentId === 'rewards') {
        const rewardsData = getStudentRewards(state.currentUser.id);
        const totalPoints = rewardsData.totalPoints;
        const earnedBadges = rewardsData.badges || [];

        const leaderboard = [
            {rank: 1, name: 'Rohan', pts: 1350, avatar: 2}, 
            {rank: 2, name: 'Priya', pts: 1100, avatar: 3},
            {rank: 3, name: state.currentUser.name, pts: totalPoints, avatar: state.currentUser.avatar.replace('avatar', '')}
        ].sort((a, b) => b.pts - a.pts);

        leaderboard.forEach((player, index) => player.rank = index + 1);
        
        const badges = [
            { nameKey: "badge_science_whiz", icon: "fa-flask", color: "blue" },
            { nameKey: "badge_perfect_week", icon: "fa-calendar-check", color: "green" },
            { nameKey: "badge_quick_learner", icon: "fa-bolt", color: "yellow" }
        ];

        content = `
            <div class="slide-up text-center bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 rounded-2xl shadow-md">
                <i class="fas fa-star text-5xl"></i>
                <h2 class="text-4xl font-extrabold mt-2">${totalPoints}</h2>
                <p class="opacity-80">${t('total_points')}</p>
            </div>
            <div class="slide-up mt-6" style="animation-delay: 100ms;">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${t('your_achievements')}</h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    ${badges.map(b => {
                        const hasBadge = earnedBadges.includes(b.nameKey);
                        return `
                            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md ${hasBadge ? '' : 'opacity-40'}">
                                <div class="bg-${b.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <i class="fas ${b.icon} text-3xl text-${b.color}-500"></i>
                                </div>
                                <p class="text-xs font-semibold mt-2 text-gray-700 dark:text-gray-300">${t(b.nameKey)}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="slide-up mt-6" style="animation-delay: 200ms;">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${t('class_rank')}</h3>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-3">
                    ${leaderboard.map(p => `
                        <div class="flex items-center ${p.name===state.currentUser.name ? 'bg-teal-50 dark:bg-teal-900/50 p-2 rounded-lg':''}">
                            <span class="font-bold text-lg w-8">${p.rank}.</span>
                            <img src="./assets/avatar${p.avatar}.svg" class="w-8 h-8 rounded-full mr-3" alt="avatar">
                            <span class="text-gray-800 dark:text-white flex-1">${p.name}</span>
                            <span class="font-bold text-amber-500">${p.pts} pts</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    } else if (contentId === 'profile') {
        content = `<div id="profile-screen-container" class="slide-up flex flex-col items-center text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md"><img id="profile-avatar-display" src="./assets/${state.currentUser.avatar}.svg" class="w-24 h-24 rounded-full mb-4 border-4 border-white dark:border-gray-700 shadow-lg" alt="Current user avatar"><h2 class="text-2xl font-bold text-gray-800 dark:text-white">${state.currentUser.name}</h2><p class="text-gray-500 dark:text-gray-400">${t('class_8')}</p></div><div class="slide-up mt-4" style="animation-delay: 100ms;"><h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">${t('choose_avatar_title')}</h3><div class="grid grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">${[1,2,3,4].map(i => `<img src="./assets/avatar${i}.svg" onclick="selectAvatar('avatar${i}')" class="avatar-option w-12 h-12 rounded-full cursor-pointer transition-all duration-200 ${state.currentUser.avatar===`avatar${i}` ? 'ring-4 ring-teal-500' : 'opacity-60 hover:opacity-100'}" id="avatar${i}-selector" alt="Avatar option ${i}">`).join('')}</div></div>`;
    } else if (contentId === 'settings') {
        content = `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('settings')}</h3>
        <div class="slide-up bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm space-y-2">
            <div class="flex justify-between items-center p-2">
                <span class="text-gray-800 dark:text-white"><i class="fas fa-palette w-6 mr-2 text-gray-500 dark:text-gray-400"></i> ${t('dark_theme')}</span>
                <div class="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" onchange="toggleTheme()" id="theme-toggle-checkbox" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${htmlEl.classList.contains('dark') ? 'checked' : ''}/>
                    <label for="theme-toggle-checkbox" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                </div>
            </div>
            <div class="flex justify-between items-center p-2">
                <span class="text-gray-800 dark:text-white"><i class="fas fa-desktop w-6 mr-2 text-gray-500 dark:text-gray-400"></i> ${t('website_view')}</span>
                <div class="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" onchange="toggleViewMode()" id="view-mode-toggle-checkbox" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${localStorage.getItem('viewMode') === 'website' ? 'checked' : ''}/>
                    <label for="view-mode-toggle-checkbox" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
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
    } else if (contentId === 'attendance') {
        let presentCount = 0; let absentCount = 0;
        Object.values(attendanceRecords).forEach(record => {
            if (record[state.currentUser.id] === 'present') presentCount++;
            if (record[state.currentUser.id] === 'absent') absentCount++;
        });
        content = `
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('my_attendance')}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-100 dark:bg-green-900/50 p-4 rounded-xl text-center"><p class="text-3xl font-bold text-green-600 dark:text-green-300">${presentCount}</p><p class="font-semibold text-green-800 dark:text-green-200">${t('days_present')}</p></div>
                <div class="bg-red-100 dark:bg-red-900/50 p-4 rounded-xl text-center"><p class="text-3xl font-bold text-red-600 dark:text-red-300">${absentCount}</p><p class="font-semibold text-red-800 dark:text-red-200">${t('days_absent')}</p></div>
            </div>`;
    } else if (contentId === 'timetable') {
        content = `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('class_timetable')}</h3><div id="student-timetable-grid">${renderTimetableForStudent()}</div>`;
    } else if (contentId === 'syllabus') {
        content = `<h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${t('syllabus')}</h3>
        <div class="space-y-4">
            ${subjects.map((s, index) => {
                const subjectSyllabus = syllabusData[s.name.english] || [];
                return `
                <div class="slide-up bg-white dark:bg-gray-800 rounded-xl shadow-md" style="animation-delay: ${index * 100}ms">
                    <button onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180')" class="w-full flex justify-between items-center p-4 font-bold text-lg text-left">
                        <span>${ts(s.name)}</span>
                        <i class="fas fa-chevron-down transform transition-transform"></i>
                    </button>
                    <div class="hidden p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        ${subjectSyllabus.length > 0 ? subjectSyllabus.map(topic => `
                            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p class="font-bold text-gray-800 dark:text-white">${ts(topic.title)}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${ts(topic.details)}</p>
                                <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 pl-2 space-y-1">
                                    ${topic.subtopics.map(subtopic => `<li>${ts(subtopic)}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('') : `<p>${t('coming_soon')}</p>`}
                    </div>
                </div>
            `}).join('')}
        </div>`;
    } else if (contentId === 'offline') {
        showScreen('sync');
        return;
    }
    mainContentContainer.innerHTML = content;
}


export function showChapterList(subjectEngName) {
    state.setCurrentSubjectEnglishName(subjectEngName);
    const subject = subjects.find(s => s.name.english === subjectEngName);
    if (!subject) return;

    document.getElementById('chapter-list-title').innerText = ts(subject.name);
    const subjectChapters = chapters[subject.name.english] || [];
    let content = `<div class="space-y-12 relative">${subjectChapters.map((c, i) => `
        <div class="chapter-path-item relative flex items-center ${c.progress === 0 && i > 0 && subjectChapters[i-1].progress < 100 ? 'opacity-50' : ''}" style="animation-delay: ${i*100}ms">
            <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg flex-1 flex items-center justify-between cursor-pointer transition-shadow hover:shadow-xl" 
                 onclick="${c.progress === 0 && i > 0 && subjectChapters[i-1].progress < 100 ? '' : `openLesson('${subject.name.english}', '${c.name.english}')`}">
                <div>
                    <h4 class="font-bold text-lg text-gray-800 dark:text-white">${ts(c.name)}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${t('status')}: ${c.progress === 100 ? t('status_completed') : t('status_in_progress')}</p>
                </div>
                ${c.progress === 0 && i > 0 && subjectChapters[i-1].progress < 100 ? '<i class="fas fa-lock text-gray-400 text-2xl"></i>' : `<i class="fas fa-play-circle text-teal-500 text-3xl"></i>`}
            </div>
        </div>`).join('')}</div>`;
    document.getElementById('chapter-list-content').innerHTML = content;
    showScreen('chapterList');
}

export function openLesson(subjectEngName, chapterEngName) {
    const subject = subjects.find(s => s.name.english === subjectEngName);
    const chapter = chapters[subjectEngName]?.find(c => c.name.english === chapterEngName);
    if (!subject || !chapter) {
        console.error("Could not find subject or chapter", subjectEngName, chapterEngName);
        return;
    }

    const content = lessonContent[subjectEngName]?.[chapterEngName];
    
    // --- Fetch Uploaded Content ---
    const chapterAssignments = assignments[subjectEngName]?.[chapterEngName] || [];
    const uploadedNotes = chapterNotes[subjectEngName]?.[chapterEngName] || [];
    const uploadedVideos = videoLessons[subjectEngName]?.[chapterEngName] || [];

    // --- Prepare HTML for each content type ---
    let assignmentContentHtml = chapterAssignments.length > 0 ? chapterAssignments.map(a => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 overflow-hidden"><i class="fas fa-file-alt text-xl text-blue-500"></i><span class="font-semibold text-gray-700 dark:text-gray-200 truncate">${a.fileName}</span></div>
            <div class="flex items-center space-x-2 ml-4">
                <button onclick="openNotesViewer('${a.fileUrl}', '${a.fileName}')" class="text-gray-500 hover:text-teal-500 p-2"><i class="fas fa-eye"></i></button>
                <a href="${a.fileUrl}" download="${a.fileName}" class="text-gray-400 hover:text-teal-500 p-2"><i class="fas fa-download"></i></a>
            </div>
        </div>`).join('') : `<p class="text-center text-gray-500 dark:text-gray-400">${t('no_assignments')}</p>`;

    let notesContentHtml = uploadedNotes.length > 0 ? uploadedNotes.map(note => `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 overflow-hidden"><i class="fas fa-file-pdf text-xl text-red-500"></i><span class="font-semibold text-gray-700 dark:text-gray-200 truncate">${note.fileName}</span></div>
            <div class="flex items-center space-x-2 ml-4">
                <button onclick="openNotesViewer('${note.fileUrl}', '${note.fileName}')" class="text-gray-500 hover:text-teal-500 p-2"><i class="fas fa-eye"></i></button>
                <a href="${note.fileUrl}" download="${note.fileName}" class="text-gray-400 hover:text-teal-500 p-2"><i class="fas fa-download"></i></a>
            </div>
        </div>`).join('') : `<p class="text-center text-gray-500 dark:text-gray-400">No notes uploaded by the teacher for this chapter yet.</p>`;

        let videoContentHtml = uploadedVideos.length > 0 ? uploadedVideos.map(video => `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-2">
                <p class="font-semibold text-gray-700 dark:text-gray-200">${video.fileName}</p>
                <video controls class="w-full rounded">
                    <source src="${video.fileUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>`).join('') : `<p class="text-center text-gray-500 dark:text-gray-400">${t('no_videos_uploaded')}</p>`;

    // --- Render Header and Static Content ---
    screens.lesson.querySelector('#lesson-subject').innerText = ts(subject.name);
    screens.lesson.querySelector('#lesson-title').innerText = ts(chapter.name);

    if (content) {
        screens.lesson.querySelector('#lesson-content').innerHTML = `<p class="text-gray-700 dark:text-gray-300 leading-relaxed">${ts(content.lesson)}</p>`;
        screens.lesson.querySelector('#summary-content').innerHTML = `<ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">${content.summary.map(item => `<li>${ts(item)}</li>`).join('')}</ul>`;
        const quizOptionsHtml = content.quiz.options.map(opt => `<button onclick="checkAnswer(this, ${opt.correct})" class="quiz-option w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">${ts(opt.text)}</button>`).join('');
        screens.lesson.querySelector('#quiz-content').innerHTML = `<div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><p class="font-semibold mb-3 text-gray-800 dark:text-white">${ts(content.quiz.question)}</p><div class="space-y-2" id="quiz-options">${quizOptionsHtml}</div></div><div id="quiz-result" class="hidden text-center mt-4"></div>`;
    } else {
        const comingSoonText = t('coming_soon');
        ['#lesson-content', '#summary-content', '#quiz-content'].forEach(id => screens.lesson.querySelector(id).innerHTML = `<p>${comingSoonText}</p>`);
    }
    
    // --- Inject Uploaded Content into their Divs ---
    const mainContent = screens.lesson.querySelector('main');
    const contentDivs = {
        '#assignment-content': assignmentContentHtml,
        '#notes-content': notesContentHtml,
        '#video-content': videoContentHtml
    };

    for (const id in contentDivs) {
        let div = mainContent.querySelector(id);
        if (!div) {
            div = document.createElement('div');
            div.id = id.substring(1);
            div.className = 'lesson-tab-content hidden space-y-4';
            mainContent.appendChild(div);
        }
        div.innerHTML = contentDivs[id];
    }

    showScreen('lesson');
    showLessonTab('lesson-content');
}

// In ui.js, REPLACE the showLessonTab function

export function showLessonTab(tabId) {
    document.querySelectorAll('.lesson-tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId)?.classList.remove('hidden');
    
    const navContainer = screens.lesson.querySelector('nav');
    // Re-create the nav bar with the new Videos tab
    navContainer.innerHTML = `
       <button onclick="showLessonTab('lesson-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">📖 ${t('lesson')}</button>
       <button onclick="showLessonTab('summary-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">✨ ${t('summary')}</button>
       <button onclick="showLessonTab('video-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">▶️ ${t('videos')}</button>
       <button onclick="showLessonTab('notes-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">📝 Notes</button>
       <button onclick="showLessonTab('assignment-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">📋 ${t('assignment')}</button>
       <button onclick="showLessonTab('quiz-content')" class="lesson-tab w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm">🤔 ${t('quiz')}</button>
    `;
    
    document.querySelectorAll('.lesson-tab').forEach(btn => {
        btn.classList.remove('border-teal-500', 'text-teal-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeButton = document.querySelector(`.lesson-tab[onclick="showLessonTab('${tabId}')"]`);
    if (activeButton) {
       activeButton.classList.add('border-teal-500', 'text-teal-600');
       activeButton.classList.remove('border-transparent', 'text-gray-500');
    }
}

export function checkAnswer(button, isCorrect) {
    document.querySelectorAll('#quiz-options button').forEach(btn => btn.disabled = true);
    let resultHtml = '';
    if(isCorrect) {
        button.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-400', 'text-green-800', 'dark:text-white');
        resultHtml = `<h4 class="font-bold text-green-600">${t('quiz_result_correct')}</h4><button class="mt-2 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg">${t('quiz_challenge_friend')}</button>`;
        triggerConfetti();
    } else {
        button.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-400', 'text-red-800', 'dark:text-white');
        resultHtml = `<h4 class="font-bold text-red-600">${t('quiz_result_incorrect')}</h4>`;
    }
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.innerHTML = resultHtml;
    resultDiv.classList.remove('hidden');
}

export function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    for (let i = 0; i < 100; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.backgroundColor = celebrationColors[Math.floor(Math.random() * celebrationColors.length)];
        piece.style.animationDelay = `${Math.random() * 3}s`;
        piece.style.width = `${Math.random() * 8 + 5}px`;
        piece.style.height = `${Math.random() * 8 + 5}px`;
        piece.style.opacity = Math.random() * 0.5 + 0.5;
        container.appendChild(piece);
        setTimeout(() => { piece.remove(); }, 7000); 
    }
}

export function toggleTheme() {
    htmlEl.classList.toggle('dark');
    localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
}

export function toggleViewMode() {
    const appContainer = document.getElementById('app-container');
    const checkbox = document.getElementById('view-mode-toggle-checkbox');
    appContainer.classList.toggle('view-website');
    if (appContainer.classList.contains('view-website')) {
        localStorage.setItem('viewMode', 'website');
        if (checkbox) checkbox.checked = true;
    } else {
        localStorage.setItem('viewMode', 'app');
        if (checkbox) checkbox.checked = false;
    }
}

export function createAvatarAssets() {
    document.querySelectorAll('#avatar-assets svg').forEach(svg => {
        const url = URL.createObjectURL(new Blob([svg.outerHTML], {type: 'image/svg+xml'}));
        document.querySelectorAll(`img[src='./assets/${svg.id}.svg']`).forEach(img => img.src = url);
    });
}

export function toggleQuestionModal(show) {
    const modal = document.getElementById('ask-question-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('question-textarea').value = '';
    }
}

export function selectAvatar(avatarId) {
    state.setCurrentUser({ ...state.currentUser, avatar: avatarId });
    document.querySelectorAll('.avatar-option').forEach(el => { el.classList.remove('ring-4', 'ring-teal-500'); el.classList.add('opacity-60'); });
    document.getElementById(`${avatarId}-selector`).classList.add('ring-4', 'ring-teal-500');
    document.getElementById(`${avatarId}-selector`).classList.remove('opacity-60');
    const newSrc = `./assets/${avatarId}.svg`;
    document.getElementById('profile-avatar-display').src = newSrc;
    document.getElementById('menu-avatar').src = newSrc;
}

// Functions to control the notes viewer modal
export function openNotesViewer(noteUrl, noteName) {
    const modal = document.getElementById('notes-viewer-modal');
    const iframe = document.getElementById('notes-viewer-iframe');
    const title = document.getElementById('notes-viewer-title');

    if (modal && iframe && title) {
        title.innerText = noteName;
        iframe.src = noteUrl;
        modal.classList.remove('hidden');
    }
}

export function closeNotesViewer() {
    const modal = document.getElementById('notes-viewer-modal');
    const iframe = document.getElementById('notes-viewer-iframe');
    
    if (modal && iframe) {
        modal.classList.add('hidden');
        iframe.src = ''; // Important: clear the src to stop loading/rendering
    }
}
export function showInbuiltContent(contentType) {
    let title = '';
    if (contentType === 'notes') title = t('inbuilt_notes');
    else if (contentType === 'assignment') title = t('inbuilt_assignments');
    else title = t('assignment_solutions');

    const availableSubjects = subjects.filter(s => inbuiltContent[s.name.english]);

    const content = `
        <div class="slide-up">
            <button onclick="showMainContent('practice')" class="text-teal-500 font-semibold mb-4">&larr; ${t('back_to_practice_zone')}</button>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${title}</h3>
            <div class="space-y-4">${availableSubjects.map(s => `
                <div onclick="showInbuiltChapterList('${s.name.english}', '${contentType}')" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all">
                    <div class="bg-${s.color}-100 dark:bg-${s.color}-900/50 w-16 h-16 rounded-lg flex items-center justify-center pointer-events-none">
                        <i class="fas ${s.icon} text-3xl text-${s.color}-500"></i>
                    </div>
                    <div class="pointer-events-none">
                        <h4 class="font-bold text-xl text-gray-800 dark:text-white">${ts(s.name)}</h4>
                    </div>
                </div>
            `).join('')}</div>
        </div>
    `;
    mainContentContainer.innerHTML = content;
}

/**
 * Renders the chapter selection screen for a given subject.
 */
export function showInbuiltChapterList(subjectEngName, contentType) {
    let title = '';
    if (contentType === 'notes') title = t('inbuilt_notes');
    else if (contentType === 'assignment') title = t('inbuilt_assignments');
    else title = t('assignment_solutions');

    const subjectChapters = chapters[subjectEngName] || [];
    const availableChapters = subjectChapters.filter(c => inbuiltContent[subjectEngName]?.[c.name.english]?.[contentType]);

    const content = `
        <div class="slide-up">
            <button onclick="showInbuiltContent('${contentType}')" class="text-teal-500 font-semibold mb-4">&larr; ${t('back_to_subjects')}</button>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-baloo">${title}</h3>
            <div class="space-y-3">${availableChapters.map(c => `
                <div onclick="displayInbuiltContent('${subjectEngName}', '${c.name.english}', '${contentType}')" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <h4 class="font-semibold text-gray-800 dark:text-white pointer-events-none">${ts(c.name)}</h4>
                    <i class="fas fa-chevron-right text-gray-400 pointer-events-none"></i>
                </div>
            `).join('')}</div>
        </div>
    `;
    mainContentContainer.innerHTML = content;
}

/**
 * Displays the final inbuilt content for a chapter.
 */
export function displayInbuiltContent(subjectEngName, chapterEngName, contentType) {
    const data = inbuiltContent[subjectEngName]?.[chapterEngName]?.[contentType];
    if (!data) return;

    let contentHtml = '';
    if (contentType === 'notes') {
        contentHtml = data.content.map(point => `<p class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">${point}</p>`).join('');
    } else if (contentType === 'assignment') {
        contentHtml = `<ol class="list-decimal list-inside space-y-3">${data.questions.map(q => `<li>${q}</li>`).join('')}</ol>`;
    } else if (contentType === 'assignmentSolution') {
        contentHtml = data.solutions.map(s => `<div class="p-3 bg-green-50 dark:bg-green-900/40 rounded-lg">${s}</div>`).join('');
    }

    const content = `
        <div class="slide-up">
            <button onclick="showInbuiltChapterList('${subjectEngName}', '${contentType}')" class="text-teal-500 font-semibold mb-4">&larr; ${t('back_to_subjects')}</button>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">${data.title}</h3>
                <div class="text-gray-700 dark:text-gray-300 space-y-4">${contentHtml}</div>
            </div>
        </div>
    `;
    mainContentContainer.innerHTML = content;
}