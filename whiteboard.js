// This file contains all logic for the Digital Whiteboard feature

// --- Upgraded Whiteboard Logic ---
let canvas, ctx, isDrawing = false, penColor = '#000000', currentTool = 'pen', penWidth = 8;
let historyStack = [];

function initCanvas() {
    canvas = document.getElementById('whiteboard-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseout', endPosition);
    canvas.addEventListener('touchstart', startPosition, { passive: false });
    canvas.addEventListener('touchend', endPosition, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    setTool('pen');
    setPenSize(8);
    setPenColor('#000000');
    document.querySelector('.wb-color').classList.add('active-color');
    saveState();
}

function startPosition(e) {
    isDrawing = true;
    draw(e);
}

function endPosition() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    saveState();
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    if (currentTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
    } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.lineWidth = penWidth;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.wb-tool').forEach(btn => btn.classList.remove('active-tool'));
    document.getElementById(`${tool}-tool`).classList.add('active-tool');
}

function setPenSize(size) {
    penWidth = size;
    document.querySelectorAll('.wb-size').forEach(btn => btn.classList.remove('active-size'));
    if (size === 3) document.getElementById('size-small').classList.add('active-size');
    if (size === 8) document.getElementById('size-medium').classList.add('active-size');
    if (size === 15) document.getElementById('size-large').classList.add('active-size');
}

function setPenColor(color) {
    penColor = color;
    setTool('pen');
    const targetButton = event.target;
    document.querySelectorAll('.wb-color').forEach(btn => btn.classList.remove('active-color'));
    targetButton.classList.add('active-color');
}

function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyStack = [];
    saveState();
}

function saveState() {
    if (!ctx || !canvas) return;
    historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undoLast() {
    if (historyStack.length > 1) {
        historyStack.pop();
        const lastState = historyStack[historyStack.length - 1];
        ctx.putImageData(lastState, 0, 0);
    }
}

function saveDrawing() {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `navi-kalam-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Export only the functions that need to be called by the HTML (onclick)
export { initCanvas, setTool, setPenSize, setPenColor, clearCanvas, undoLast, saveDrawing };