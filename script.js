//Elementos dinamicos HTML
const board = document.getElementById("board");
const scoreBoard = document.getElementById("scoreBoard");
const startButton = document.getElementById("start");
const gameOverSign = document.getElementById("gameOver");

//Nuevos Elementos
const bestBoard = document.getElementById("bestBoard");
const lengthBoard = document.getElementById("lengthBoard");
const levelBoard = document.getElementById('levelBoard');
const speedBoard = document.getElementById('speedBoard');
const timeBoard = document.getElementById('timeBoard');
const pauseButton = document.getElementById('pause');
const restartButton = document.getElementById('restart');
const finalScore = document.getElementById('finalScore');
const finalBest = document.getElementById('finalBest');
const sizeSelect = document.getElementById('sizeSelect');
const speedSelect = document.getElementById('speedSelect');
const modeSelect = document.getElementById('modeSelect');
const skinSelect = document.getElementById('skinSelect');
const volumeSlider = document.getElementById('volumeSlider');

//Configuraciones del juego
let boardSize = 10;
let gameSpeed = 100;
let gameMode = "walls"; //Puede ser wrap
let skin = "classic";//"" ''
let masterVolume = 0.4;
const squareTypes = {
    emptySquare: 0,
    snakeSquare: 1,
    foodSquare: 2
};

//Direcciones 
const directions = {
    ArrowUp: (size)=>-size,
    ArrowDown: (size)=>size,
    ArrowRight: ()=>1,
    ArrowLeft: ()=>2,
}

//Variables del juego
let snake;
let score;
let direction;
let boardSquares;
let emptySquares;
let moveInterval;
let paused = false;
let startTimestamp;
let elapsedMs = 0;
let timerInterval;
let level = 1;
let bestScore = Number(localStorage.getItem('snake_best_score')|| 0);

//Audio
let audioCtx;
const playBeep = (freq = 600, duration = 100, type = "sine", gainValue = 0.03)=>{
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webKitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = gainValue * masterVolume;
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        setTimeout(()=>{
            o.stop(); o.disconnect(); g.disconnect();
        }, duration)
    } catch (error) {
        console.log("Ocurrió un error" + error);
    }
}

const playEat = () =>{ playBeep(740, 80, 'square', 0.2)}
const playGameOver = () =>{
    playBeep(200,180, 'sawtooth', 0.25);
    setTimeout(()=> playBeep(160, 220, 'sawtooth', 0.25), 100)
}

const playPause = () =>{playBeep(500,80, 'triangle', 0.15)}
const playResume = () =>{playBeep(720,80, 'triangle', 0.15)}

//Dibuajr el cuerpo de la serpiente
const drawSnake = () =>{
    snake.forEach( square => drawSquare(square, 'snakeSquare'))
    updateLength()
}

//Dibuajr los cuadrados
const drawSquare = (square, type) => {
    const row = Math.floor(square / boardSize)
    const column = square % boardSize
    boardSquares[row][column] = squareTypes[type]
    const squareElement = document.getElementById(String(square).padStart(2, '0'))
    squareElement.setAttribute('class', `square ${type}`)
}

//Prsonalizar el skin
const setSkin = (name) => {
    skin = name
    let color
    switch (name) {
        case 'neon': color = getComputedStyle(
            document.documentElement
        ).getPropertyValue('--snake-color-neon').trim()
            break;
        case 'retro': color = getComputedStyle(
            document.documentElement
        ).getPropertyValue('--snake-color-retro').trim()
            break;
        case 'matrix': color = getComputedStyle(
            document.documentElement
        ).getPropertyValue('--snake-color-matrix').trim()
            break;
        default: color = getComputedStyle(
            document.documentElement
        ).getPropertyValue('--snake-color-classic').trim()
            break;
    }
    document.documentElement.style.setProperty('--grid-snake', color)
}

//Mover la serpiente
const moveSnake = () =>{
    if(paused) return
    const head = snake[snake.length -1]//en prom las listas y arrays comienzan con 0
    const delta = directions[direction](boardSize)
    let newSquare = head + delta
    let newRow = Math.floor(newSquare / boardSize)
    let newCol = newSquare % boardSize
    const oldCol = head % boardSize

    if (gameMode === 'wrap') {
		if (direction === 'ArrowRight' && newCol === 0 && oldCol === boardSize - 1) {
			newSquare = head - (boardSize - 1)
		} else if (direction === 'ArrowLeft' && newCol === boardSize - 1 && oldCol === 0) {
			newSquare = head + (boardSize - 1)
		} else if (newSquare < 0) {
			newSquare = boardSize * boardSize + newSquare
		} else if (newSquare >= boardSize * boardSize) {
			newSquare = newSquare - boardSize * boardSize
		}
		newRow = Math.floor(newSquare / boardSize)
		newCol = newSquare % boardSize
	}

    const outOfBounds = newSquare < 0 || newSquare >= boardSize * boardSize
	const crossingRight = direction === 'ArrowRight' && newCol === 0 && oldCol === boardSize - 1
	const crossingLeft = direction === 'ArrowLeft' && newCol === boardSize - 1 && oldCol === 0

    if( (gameMode === 'walls' && (outOfBounds || crossingRight || crossingLeft)) ||
		boardSquares[newRow]?.[newCol] === squareTypes.snakeSquare) {
		gameOver()
	} else {
		snake.push(newSquare);
		if(boardSquares[newRow][newCol] === squareTypes.foodSquare) {
			addFood()
			playEat()
		} else {
			const emptySquare = snake.shift()
			drawSquare(emptySquare, 'emptySquare')
		}
		drawSnake()
	}

}


