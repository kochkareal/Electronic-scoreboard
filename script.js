class LampBoard {
    constructor(boardElement) {
        this.boardElement = boardElement;
        this.lamps = [];
        this.undoStack = [];
    }

    showMessage(message, duration = 3000) {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.textContent = message;
        messagesDiv.style.display = 'block';
        setTimeout(() => {
            messagesDiv.style.display = 'none';
        }, duration);
    }

    createLamps(numColumns, numRows) {
        if (numColumns < 1 || numRows < 1) {
            this.showMessage('Недопустимые размеры');
            return;
        }

        this.boardElement.style.gridTemplateColumns = `repeat(${numColumns}, 10px)`;
        const fragment = document.createDocumentFragment();
        this.lamps = new Array(numColumns * numRows);

        for (let i = 0; i < numColumns * numRows; i++) {
            const lamp = document.createElement('div');
            lamp.classList.add('lamp');
            lamp.tabIndex = 0;
            lamp.setAttribute('role', 'gridcell');
            lamp.setAttribute('aria-label', `Лампочка ${i + 1}`);
            fragment.appendChild(lamp);
            this.lamps[i] = lamp;

            lamp.addEventListener('click', () => {
                this.toggleLamp(lamp);
                this.saveState();
            });

            lamp.addEventListener('mouseover', (event) => {
                if (event.buttons === 1) {
                    lamp.classList.add('on');
                }
            });

            lamp.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    this.toggleLamp(lamp);
                    this.saveState();
                }
            });

            lamp.addEventListener('touchstart', () => {
                this.toggleLamp(lamp);
                this.saveState();
            });
        }
        this.boardElement.appendChild(fragment);
    }

    toggleLamp(lamp) {
        lamp.classList.toggle('on');
    }

    saveState() {
        const state = this.lamps.map(lamp => (lamp.classList.contains('on') ? '1' : '0')).join('');
        this.undoStack.push(state);
    }

    restoreState(state) {
        if (state.length !== this.lamps.length) {
            this.showMessage('Некорректное состояние');
            return;
        }

        for (let i = 0; i < state.length; i++) {
            this.lamps[i].classList.toggle('on', state[i] === '1');
        }
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.undoStack.pop();
            this.restoreState(this.undoStack[this.undoStack.length - 1]);
        }
    }

    exportJson() {
        const state = this.lamps.map(lamp => lamp.classList.contains('on') ? 1 : 0);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tablo_state.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        this.showMessage('Экспортировано в JSON');
    }

    exportPng() {
        const numColumns = document.getElementById('widthInput').value || 50;
        const numRows = document.getElementById('heightInput').value || 30;

        const canvas = document.createElement('canvas');
        canvas.width = numColumns * 15 - 5;
        canvas.height = numRows * 15 - 5;
        const ctx = canvas.getContext('2d');

        this.lamps.forEach((lamp, index) => {
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
        this.showMessage('Экспортировано в PNG');
    }

    importJson(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            const state = JSON.parse(e.target.result);
            this.restoreState(state);
            this.saveState();
            this.showMessage('Импортировано из JSON');
        };
        reader.readAsText(file);
    }

    applySize() {
        const numColumns = document.getElementById('widthInput').value || 50;
        const numRows = document.getElementById('heightInput').value || 30;

        if (numColumns && numRows) {
            localStorage.setItem('boardColumns', numColumns);
            localStorage.setItem('boardRows', numRows);

            this.boardElement.innerHTML = '';
            this.createLamps(numColumns, numRows);
            this.saveState();
            this.showMessage('Размер применен');
        } else {
            this.showMessage('Пожалуйста, введите корректные размеры', 5000);
        }
    }
}

const lampBoard = new LampBoard(document.getElementById('board'));

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'z') {
        lampBoard.undo();
    }
});

document.getElementById('exportJson').addEventListener('click', () => lampBoard.exportJson());
document.getElementById('exportPng').addEventListener('click', () => lampBoard.exportPng());
document.getElementById('importJson').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = event => lampBoard.importJson(event);
    input.click();
});

document.getElementById('applySize').addEventListener('click', () => lampBoard.applySize());

const savedColumns = localStorage.getItem('boardColumns') || 50;
const savedRows = localStorage.getItem('boardRows') || 30;
document.getElementById('widthInput').value = savedColumns;
document.getElementById('heightInput').value = savedRows;
lampBoard.applySize();

// Экспорт класса для тестирования
// module.exports = LampBoard;
