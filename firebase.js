// This file handles all interactions with Firebase services.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken , createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, getDoc, setDoc  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as state from './state.js';
import { subjects } from './data.js';
import { ts, t } from './main.js';

export let app, db, auth, appId, userId;

export async function initFirebase() {
    try {
        const firebaseConfig = {
  apiKey: "AIzaSyD_5UnNNLXznSoqhoQ1E5fjn4N_pGht2HY",
  authDomain: "navi-kalam-18.firebaseapp.com",
  projectId: "navi-kalam-18",
  storageBucket: "navi-kalam-18.firebasestorage.app",
  messagingSenderId: "1073596564990",
  appId: "1:1073596564990:web:79a49d82bb02005f8f2caf"
};
        if (!firebaseConfig || !firebaseConfig.apiKey) { // This check is slightly different now
            console.error("Firebase config not found.");
            return;
        }
        appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        userId = auth.currentUser?.uid || crypto.randomUUID();
        
        state.setFirebaseState({ app, db, auth, appId, userId });
        console.log("Firebase initialized and user signed in. UserID:", userId);
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
}

export async function submitQuestion() {
    const textarea = document.getElementById('question-textarea');
    const questionText = textarea.value.trim();
    if (!questionText || !db) return;

    try {
        const doubtsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'doubts');
        await addDoc(doubtsCollection, {
            text: questionText,
            authorName: state.currentUser.name,
            userId: userId,
            subject: state.currentSubjectEnglishName,
            createdAt: serverTimestamp()
        });
        window.toggleQuestionModal(false); 
    } catch (error) {
        console.error("Error adding document: ", error);
    }
}

export function loadDoubtForum() {
    if (!db) {
        document.getElementById('doubt-list-container').innerHTML = `<p class="text-center text-red-500">Database not connected.</p>`;
        return;
    }
    const subject = subjects.find(s => s.name.english === state.currentSubjectEnglishName);
    if (!subject) return;
    
    document.getElementById('doubt-forum-title').innerText = `${ts(subject.name)} ${t('doubt_forum')}`;
    const container = document.getElementById('doubt-list-container');
    container.innerHTML = `<div class="text-center p-8"><i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i></div>`;
    
    if (state.unsubscribeDoubtListener) state.unsubscribeDoubtListener();
    
    const doubtsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'doubts');
    const q = query(doubtsCollection, where("subject", "==", state.currentSubjectEnglishName));
    
    const listener = onSnapshot(q, (querySnapshot) => {
        const questions = [];
        querySnapshot.forEach((doc) => {
            questions.push({ id: doc.id, ...doc.data() });
        });
        questions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        if (questions.length === 0) {
            container.innerHTML = `<div class="text-center p-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-comment-slash text-4xl mb-3"></i>
                <p>No questions asked yet for this subject.</p>
                <p>Be the first to ask!</p>
            </div>`;
            return;
        }
        
        container.innerHTML = questions.map(q => `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p class="font-semibold text-gray-800 dark:text-white">${q.text}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Asked by ${q.authorName}</p>
            </div>
        `).join('');
    }, (error) => {
        console.error("Error fetching questions: ", error);
        container.innerHTML = `<p class="text-center text-red-500">Could not load questions.</p>`;
    });

    state.setUnsubscribeDoubtListener(listener);
}
// In firebase.js
export async function handleSignUp(name, email, password, role) {
    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("New user created in Auth:", user.uid);

        // Step 2: Create the user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid); // Use the UID as the document ID
        await setDoc(userDocRef, {
            name: name,
            email: email,
            role: role,
            avatar: "avatar1", // Default avatar
            class: role === 'student' ? "Class 8" : "" // Default class for students
        });
        console.log("User profile created in Firestore.");

        return { success: true, user: user };
    } catch (error) {
        console.error("Sign up Error:", error.message);
        alert("Sign up failed: " + error.message);
        return { success: false, error: error.message };
    }
}