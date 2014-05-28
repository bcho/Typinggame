(function () {
    // Constants
    // =========
    
    var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var INITIAL_SCORE = 0,
        INITIAL_GAME_TIMES = 20,
        INITIAL_GAME_SPEED = 1,
        SPEED_UP_SCORE_SCALE = 10;
    
    var BOARD_WIDTH = window.innerWidth - 100,
        BOARD_HEIGHT = window.innerHeight - 200;

    var BTN_WIDTH = 44,
        BTN_HEIGHT = 20;

    var BUBBLE_TMPL = loadTmpl('.game-bubble-tmpl');

    // Components
    // ==========
    //
    // - [x] game board
    // - [x] letter bubble
    // - [ ] keyboard
    // - [x] start button
    // - [ ] timer
    // - [ ] game score
    // - [ ] high score board
    // - [ ] game over button
    
    /**
     * Game Board.
     *
     * @param string selector selector string for board element.
     * @param int width board's width. Defaults to window's inner width.
     * @param int height board's height. Defaults to window's inner height.
     */
    function GameBoard(opts) {
        this.elem = document.querySelector(opts.selector);
        this.width = opts.width || BOARD_WIDTH;
        this.height = opts.height || BOARD_HEIGHT;

        // Use hash table to make O(1) check.
        this.onBoardLetters = {};
    }

    /**
     * Add a letter to board.
     *
     * @param string letter letter to be added.
     * @param int x letter's x coordination.
     * @param int y letter's y coordination.
     */
    GameBoard.prototype.addLetter = function (letter, x, y) {
        var letterBubble = new LetterBubble(letter, x, y, '#cb3f20');

        this.onBoardLetters[letter] = letterBubble;
        this.draw();

        return letterBubble;
    };

    /**
     * Remove a letter from board.
     *
     * @param string letter letter to be removed.
     */
    GameBoard.prototype.removeLetter = function (letter) {
        var letterBubble = this.onBoardLetters[letter];

        if (!letterBubble) {
            return;
        }

        letterBubble.clear();
        delete this.onBoardLetters[letter];
    };

    /**
     * Check if a letter on board.
     *
     * @param string letter letter to be checked.
     */
    GameBoard.prototype.hasLetter = function (letter) {
        return !(this.onBoardLetters[letter] === undefined);
    };

    /**
     * Draw game board.
     */
    GameBoard.prototype.draw = function () {
        var buf = '';

        this.elem.style.display = 'block';

        for (var letter in this.onBoardLetters) {
            buf += this.onBoardLetters[letter].draw();
        }
        this.elem.innerHTML = buf;
    };

    /**
     * Clear game board.
     */
    GameBoard.prototype.clear = function () {
        this.elem.style.display = 'none';
    };

    /**
     * Letter Bubble.
     *
     * @param string letter bubble's letter.
     * @param int x bubble's x coordination.
     * @param int y bubble's y coordination.
     * @param string color bubble's color.
     */
    function LetterBubble(letter, x, y, color) {
        this.letter = letter;
        this.x = x;
        this.y = y;
        this.color = color;
        this.display = 'block';
    }

    /**
     * Draw letter bubble to board.
     */
    LetterBubble.prototype.draw = function () {
        return BUBBLE_TMPL(this);
    };

    /**
     * Clear letter bubble from board.
     */
    LetterBubble.prototype.clear = function () {
        var elem = document.querySelector('.bubble-' + this.letter);

        this.display = 'none';
        elem.style.display = 'none';
    };

    /**
     * Keyboard events manger.
     *
     * @param string selector selector string for element. Defaults to `body`.
     */
    function KeyboardManager(opts) {
        var opts = opts || {
            selector: 'body'
        };

        this.elem = document.querySelector(opts.selector);
        this.subscribers = [];
    }

    /**
     * Install keyboard event listeners.
     */
    KeyboardManager.prototype.installEvents = function () {
        var that = this,
            events = ['keydown'];

        function handler(e) {
            that.handleKeyDown(e);
        }

        for (var i = 0; i < events.length; i++) {
            this.elem.addEventListener(events[i], handler);
        }

        return this;
    };

    /**
     * Handle a key down event.
     *
     * @param event e key down event element.
     */
    KeyboardManager.prototype.handleKeyDown = function (e) {
        var key = String.fromCharCode(e.keyCode);

        // Skip key that not in the letters list.
        if (LETTERS.indexOf(key) === -1) {
            return;
        }

        for (var i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i](key);
        }
    };

    /**
     * Subscribe to keyboard event.
     *
     * @param func subscriber subscriber callback
     */
    KeyboardManager.prototype.subscribe = function (subscriber) {
        this.subscribers.push(subscriber);

        return this;
    };

    /**
     * Start button.
     *
     * @param string selector selector string for button.
     */
    function StartButton(opts) {
        var that = this;

        this.elem = document.querySelector(opts.selector);

        // By default, button will disappear after clicking on it.
        this.onClick(function () { that.clear() });
    }

    /**
     * Register a ``click`` event callback for start button.
     *
     * @param func callback callback to be executed when click on the button.
     */
    StartButton.prototype.onClick = function (callback) {
        this.elem.addEventListener('click', callback);

        return this;
    }

    /**
     * Draw button.
     */
    StartButton.prototype.draw = function () {
        var height = window.innerHeight,
            width = window.innerWidth;

        this.elem.style.display = 'block';

        // TODO use css to place it in the center of the monitor
        this.elem.style.width = BTN_WIDTH + 'px';
        this.elem.style.height = BTN_HEIGHT + 'px';
        this.elem.style.left = (width / 2 - BTN_WIDTH) + 'px';
        this.elem.style.top = (height / 2 - BTN_HEIGHT) + 'px';

        return this;
    };

    /**
     * Hide button.
     */
    StartButton.prototype.clear = function () {
        this.elem.style.display = 'none';

        return this;
    };


    // Game States
    // ===========

    // Componments
    var gameBoard = new GameBoard({selector: '.game-board'}),
        keyboardManager = new KeyboardManager();
        startBtn = new StartButton({selector: '.game-start'});

    var letterGenerator = randomLetter;

    // States
    var gameStates = {
        scores: INITIAL_SCORE,
        gameTimeRemains: INITIAL_GAME_TIMES,
        gameSpeed: INITIAL_GAME_SPEED
    };

    function initGame() {
        gameBoard.draw();

        startBtn
            .onClick(function () {
                // Start clock, tick tock, tick tock...
                window.setInterval(function () {
                    gameStates.gameTimeRemains -= 1;
                }, 1000);
            })
            .onClick(runGame)
            .draw();

        keyboardManager
            .installEvents()
            .subscribe(simpleScore);
    }

    function runGame() {
        var letter,
            letterPos;

        console.log('Game status', gameStates);

        if (gameStates.gameTimeRemains <= 0) {
            cleanUpGame();
            return;
        }

        letter = letterGenerator();
        letterPos = randomPosition();
        gameBoard.addLetter(letter, letterPos.x, letterPos.y);

        // TODO adjust speed up algorithm.
        if (gameStates.scores > SPEED_UP_SCORE_SCALE * gameStates.gameSpeed) {
            gameStates.gameSpeed += 1;
        }

        // Next iteration.
        window.setTimeout(runGame, 1000 / gameStates.gameSpeed);
    }

    function cleanUpGame() {
        console.log('Game is end.');
    }

    // Game Scoring Strategic
    // ======================

    function simpleScore(key) {
        if (gameBoard.hasLetter(key)) {
            gameBoard.removeLetter(key);
            gameStates.scores += 1;
            gameStates.gameTimeRemains += 1;
        } else {
            gameStates.gameTimeRemains -= 1;
        }
    }

    // Letter Generate Strategic
    // =========================

    /**
     * Generate a letter randomly.
     */
    function randomLetter() {
        var magic = randomInt(0, LETTERS.length);

        return LETTERS[magic];
    }

    // Utilities
    // =========

    function loadTmpl(selector) {
        var tmpl = document.querySelector(selector).innerHTML;

        return _.template(tmpl);
    }

    /**
     * Generate a random int from range (left inclusive, right exclusive).
     *
     * @param int lo low end.
     * @param int hi high end.
     */
    function randomInt(lo, hi) {
        var offset = parseInt(Math.random() * 100 * hi % (hi - lo), 10);

        return offset + lo;
    }

    /**
     * Generate a random screen position.
     */
    function randomPosition() {
        var winWidth = window.innerWidth,
            winHeight = window.innerHeight;

        return {x: randomInt(0, winWidth), y: randomInt(0, winHeight)};
    }


    // Kick off!
    initGame();
})();
