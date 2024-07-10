const board = document.getElementById('board');
const lamps = [];
let undoStack = [];

function showMessage(message, duration = 3000) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.textContent = message;
    messagesDiv.style.display = 'block';
    setTimeout(() => {
        messagesDiv.style.display = 'none';
    }, duration);
}

function createLamps(numColumns, numRows) {
    board.style.gridTemplateColumns = `repeat(${numColumns}, 10px)`;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < numColumns * numRows; i++) {
        const lamp = document.createElement('div');
        lamp.classList.add('lamp');
        lamp.tabIndex = 0;
        lamp.setAttribute('role', 'gridcell');
        lamp.setAttribute('aria-label', `Лампочка ${i + 1}`);
        fragment.appendChild(lamp);
        lamps.push(lamp);

        lamp.addEventListener('click', () => {
            toggleLamp(lamp);
            saveState();
        });

        lamp.addEventListener('mouseover', (event) => {
            if (event.buttons === 1) {
                lamp.classList.add('on');
            }
        });

        lamp.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                toggleLamp(lamp);
                saveState();
            }
        });

        lamp.addEventListener('touchstart', () => {
            toggleLamp(lamp);
            saveState();
        });
    }
    board.appendChild(fragment);
}

function toggleLamp(lamp) {
    lamp.classList.toggle('on');
}

function saveState() {
    const state = lamps.map(lamp => (lamp.classList.contains('on') ? '1' : '0')).join('');
    undoStack.push(state);
}

function restoreState(state) {
    for (let i = 0; i < state.length; i++) {
        lamps[i].classList.toggle('on', state[i] === '1');
    }
}

function undo() {
    if (undoStack.length > 1) {
        undoStack.pop();
        restoreState(undoStack[undoStack.length - 1]);
    }
}

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'z') {
        undo();
    }
});

document.getElementById('exportJson').addEventListener('click', () => {
    const state = lamps.map(lamp => lamp.classList.contains('on') ? 1 : 0);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tablo_state.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showMessage('Экспортировано в JSON');
});

document.getElementById('exportPng').addEventListener('click', () => {
    const numColumns = document.getElementById('widthInput').value || 50;
    const numRows = document.getElementById('heightInput').value || 30;

    const canvas = document.createElement('canvas');
    canvas.width = numColumns * 15 - 5; // (10px лампочка + 5px промежуток) - 5px за последний промежуток
    canvas.height = numRows * 15 - 5;
    const ctx = canvas.getContext('2d');

    lamps.forEach((lamp, index) => {
        const col = index % numColumns;
        const row = Math.floor(index / numColumns);
        const x = col * 15;
        const y = row * 15;
        ctx.fillStyle = lamp.classList.contains('on') ? 'lightyellow' : '#444';
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 5, 0, 2 * Math.PI);
        ctx.fill();
    });

    const dataUrl = canvas.toDataURL('image/png');
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataUrl);
    downloadAnchorNode.setAttribute("download", "tablo.png");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showMessage('Экспортировано в PNG');
});

document.getElementById('importJson').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            const state = JSON.parse(e.target.result);
            restoreState(state);
            saveState();
            showMessage('Импортировано из JSON');
        };
        reader.readAsText(file);
    };
    input.click();
});

function applySize() {
    const numColumns = document.getElementById('widthInput').value || 50;
    const numRows = document.getElementById('heightInput').value || 30;

    if (numColumns && numRows) {
        localStorage.setItem('boardColumns', numColumns);
        localStorage.setItem('boardRows', numRows);

        board.innerHTML = '';
        lamps.length = 0;
        createLamps(numColumns, numRows);
        saveState();
        showMessage('Размер применен');
    } else {
        showMessage('Пожалуйста, введите корректные размеры', 5000);
    }
}

document.getElementById('applySize').addEventListener('click', applySize);

const savedColumns = localStorage.getItem('boardColumns') || 50;
const savedRows = localStorage.getItem('boardRows') || 30;
document.getElementById('widthInput').value = savedColumns;
document.getElementById('heightInput').value = savedRows;
applySize();

// Экспорт функций для тестирования
//module.exports = { createLamps, toggleLamp, saveState, restoreState, undo };
