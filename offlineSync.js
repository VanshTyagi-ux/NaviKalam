// This file handles the WebRTC offline P2P connection logic.

let pc; // The RTCPeerConnection object
let dataChannel;
let qrScanner;

// For a purely local network, we don't need STUN servers.
const configuration = { iceServers: [] };

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
function startScanner(onSuccess) {
    qrScanner = new Html5Qrcode("qr-scanner");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    showScanner(true);
    // CORRECTED CODE
qrScanner.start({ }, config, onSuccess, (errorMessage) => {
        // handle scan failure, usually ignore
    }).catch((err) => {
        console.error("QR Scanner Error:", err);
        setStatus("Error: Could not start camera.");
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

    // This is where you would handle ICE candidates if needed for more complex networks.
    // For this simple case, we'll wait for them to be gathered automatically.
    pc.onicecandidate = (event) => {
        if (event.candidate === null) {
            // All candidates gathered, update QR with the full offer.
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

        pc.onicecandidate = (event) => {
            if (event.candidate === null) {
                const answerString = JSON.stringify(pc.localDescription);
                setQRCode(answerString);
                setStatus("Teacher: Scan this code to connect.");
            }
        };
        
        // Student listens for the data channel from the teacher
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
        // Teacher can send initial data
        if (pc.localDescription.type === 'offer') {
            dataChannel.send(JSON.stringify({ type: 'message', content: 'Hello from the teacher!' }));
        }
    };

    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        // Example of handling a received message
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