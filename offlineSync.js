// This file handles the WebRTC offline P2P connection logic.
import * as state from './state.js';

let pc; // The RTCPeerConnection object
let dataChannel;
let qrScanner;

// For a purely local network, we don't need STUN servers.
// Use Google's public STUN server to help devices find each other.
const configuration = { 
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ] 
};

// --- UI Helper Functions ---
function showInitialButtons(show) {
    document.getElementById('initial-buttons').style.display = show ? 'block' : 'none';
}
function showQRDisplay(show) {
    document.getElementById('qr-display').style.display = show ? 'flex' : 'none';
}
function showScanner(show) {
    document.getElementById('qr-scanner-container').style.display = show ? 'block' : 'none';
}
function showTeacherScanButton(show) {
    document.getElementById('teacher-scan-answer-div').style.display = show ? 'block' : 'none';
}
function setStatus(text) {
    document.getElementById('sync-status-text').innerText = text;
}
function setQRCode(dataString) {
    try {
        const qr = qrcode(0, 'L');
        qr.addData(dataString);
        qr.make();
        document.getElementById('qr-display').innerHTML = qr.createImgTag(6);
        showQRDisplay(true);
    } catch (err) {
        console.error("Error generating QR code", err);
        setStatus("Error: Could not generate QR code.");
    }
}

/**
 * UPDATED: Asks for camera permission and robustly selects a camera.
 * @param {function} onSuccess - Callback function to handle successful scan.
 */
// --- Replacement for the startScanner function in offlineSync.js ---

/**
 * UPDATED: Asks for camera permission and robustly selects a camera.
 * @param {function} onSuccess - Callback function to handle successful scan.
 */
function startScanner(onSuccess) {
    // 1. Detect if the user is on a mobile device.
    const isMobile = /Mobi/i.test(navigator.userAgent);

    // 2. Define camera selection criteria.
    // 'environment' = back camera, 'user' = front camera.
    const cameraSelectionCriteria = {
        facingMode: isMobile ? "environment" : "user"
    };

    // 3. Initialize the QR Code scanner.
    qrScanner = new Html5Qrcode("qr-scanner", {
        useBarCodeDetectorIfSupported: true,
        verbose: false // Set to true for more logs
    });

    // 4. Define the scanner configuration, including resolution.
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    };

    showScanner(true);

    // 5. Start the scanner with the camera selection criteria.
    // The library's start() method uses these criteria to pick the camera.
    qrScanner.start(
        cameraSelectionCriteria,
        config,
        onSuccess,
        (errorMessage) => { /* ignore scan errors */ }
    ).catch((err) => {
        console.error("QR Scanner Start Error:", err);
        let statusMessage = "Error: Unable to start scanner.";
        
        // Provide more specific feedback based on the error type.
        if (err.name === 'NotAllowedError') {
            statusMessage = "Camera permission was denied. You must allow camera access in your browser settings.";
        } else if (err.name === 'NotFoundError') {
             statusMessage = "Error: No suitable camera was found on this device.";
        } else if (err.name === 'NotReadableError') {
            statusMessage = "Error: The camera is already in use by another application.";
        } else {
            statusMessage = `Camera permission is required. Error: ${err}`;
        }

        setStatus(statusMessage);
        showScanner(false);
    });
}
function stopScanner() {
    if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().then(() => {
            showScanner(false);
        }).catch(err => console.error("Error stopping scanner:", err));
    }
}

// --- WebRTC Logic ---

/**
 * 1. TEACHER: Starts the session by creating an "offer".
 */
export async function startHostSession() {
    showInitialButtons(false);
    setStatus("Generating session code...");

    pc = new RTCPeerConnection(configuration);

    // -- ADD THIS FOR DEBUGGING --
    pc.oniceconnectionstatechange = (event) => {
        console.log(`ICE Connection State: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
            setStatus("Error: Connection failed. Check console for details.");
        }
    };
    // ----------------------------

    pc.onicecandidate = (event) => {
        if (event.candidate === null) {
            const offerString = JSON.stringify(pc.localDescription);
            setQRCode(offerString);
            setStatus("Student: Scan this QR code.");
            showTeacherScanButton(true);
        }
    };
    
    dataChannel = pc.createDataChannel("dataTransfer");
    setupDataChannelEvents();

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
    } catch (error) {
        console.error("Error creating offer:", error);
        setStatus("Error creating session.");
    }
}

/**
 * 2. STUDENT: Scans the teacher's offer and creates an "answer".
 */
export function joinSession() {
    showInitialButtons(false);
    setStatus("Scan the teacher's QR code...");

    startScanner((decodedText) => {
        stopScanner();
        setStatus("Creating response code...");
        
        const offer = JSON.parse(decodedText);
        pc = new RTCPeerConnection(configuration);

        // -- ADD THIS FOR DEBUGGING --
    pc.oniceconnectionstatechange = (event) => {
        console.log(`ICE Connection State: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
            setStatus("Error: Connection failed. Check console for details.");
        }
    };
    // ----------------------------

        pc.onicecandidate = (event) => {
            if (event.candidate === null) {
                const answerString = JSON.stringify(pc.localDescription);
                setQRCode(answerString);
                setStatus("Teacher: Scan this code to connect.");
            }
        };
        
        pc.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannelEvents();
        };

        pc.setRemoteDescription(offer).then(async () => {
            try {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
            } catch (error) {
                console.error("Error creating answer:", error);
                setStatus("Error: Could not create response.");
            }
        });
    });
}

/**
 * 3. TEACHER: Scans the student's answer to complete the connection.
 */
export function scanStudentAnswer() {
    showQRDisplay(false);
    showTeacherScanButton(false);
    setStatus("Scan the student's response code...");
    
    startScanner((decodedText) => {
        stopScanner();
        setStatus("Connecting...");
        
        const answer = JSON.parse(decodedText);
        pc.setRemoteDescription(answer).catch(err => {
            console.error("Error setting remote description:", err);
            setStatus("Error: Connection failed.");
        });
    });
}

/**
 * 4. BOTH: Sets up event listeners for the data channel.
 */
function setupDataChannelEvents() {
    dataChannel.onopen = () => {
        setStatus("✅ Connected!");
        showQRDisplay(false);
        if (pc.localDescription.type === 'offer') {
            dataChannel.send(JSON.stringify({ type: 'message', content: 'Hello from the teacher!' }));
        }
    };

    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        alert(`Received message: ${data.content}`);
    };

    dataChannel.onclose = () => {
        setStatus("Connection closed.");
        showInitialButtons(true);
    };

    dataChannel.onerror = (error) => {
        console.error("Data Channel Error:", error);
        setStatus("Connection error.");
    };
}

// In offlineSync.js

// ... (keep all your existing code)

/**
 * Resets the entire sync screen UI and state.
 * This should be called whenever the user navigates to this screen.
 */
export function resetSyncScreen() {
    // 1. Stop any active QR code scanner
    stopScanner();

    // 2. Close any existing WebRTC connection
    if (pc) {
        pc.onicecandidate = null;
        pc.ondatachannel = null;
        pc.oniceconnectionstatechange = null;
        pc.close();
        pc = null;
    }
    dataChannel = null;

    // 3. Reset the UI elements to their initial state
    setStatus("Ready to connect...");
    showQRDisplay(false);
    document.getElementById('qr-display').innerHTML = '';
    showScanner(false);
    showTeacherScanButton(false);
    document.getElementById('teacher-sync-content-div').style.display = 'none';

    // 4. Dynamically create the correct button based on user role
    const initialButtonsDiv = document.getElementById('initial-buttons');
    
    // Check the role from the shared state
    if (state.currentUser && state.currentUser.role === 'teacher') {
        initialButtonsDiv.innerHTML = `
            <button onclick="startHostSession()" class="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-teal-600">
                Connect With Student
            </button>
        `;
    } else { // Default to the student view
        initialButtonsDiv.innerHTML = `
            <button onclick="joinSession()" class="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600">
                Connect With Student 
            </button>
        `;
    }
    showInitialButtons(true);
}