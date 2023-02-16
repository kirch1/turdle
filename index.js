// Global Variables
var winningWord = '';
var currentRow = 1;
var guess = '';
var words;

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('span');
var errorMessage = document.querySelector('#error-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
var statsTotalGames = document.querySelector('#stats-total-games');
var statsPercentCorrect = document.querySelector('#stats-percent-correct');
var statsAverageGuesses = document.querySelector('#stats-average-guesses');
var gameOverBox = document.querySelector('#game-over-section');
var gameOverGuessCount = document.querySelector('#game-over-guesses-count');
var gameOverGuessGrammar = document.querySelector('#game-over-guesses-plural');
var gameLostBox = document.querySelector('#game-lost-section');

// Event Listeners
window.addEventListener('load', setGame);

inputs.forEach(input => input.addEventListener('keyup', function() { moveToNextInput(event) }));

keyLetters.forEach(keyLetter => keyLetter.addEventListener('click', function() { clickLetter(event) }));

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', viewStats);

// Functions
function setGame() {
  currentRow = 1;
  fetch('http://localhost:3001/api/v1/words')
    .then(response => response.json())
    .then(data => {
      words = data;
      winningWord = getRandomWord();
    })
  updateInputPermissions();
}

function getRandomWord() {
  var randomIndex = Math.floor(Math.random() * 2500);
  console.log(words[randomIndex]);
  return words[randomIndex];
}

function updateInputPermissions() {

  inputs.forEach(input => {
    if(!input.id.includes(`-${currentRow}-`)) {
      input.disabled = true;
    } else {
      input.disabled = false;
    }
  });

  inputs[0].focus();
}

function moveToNextInput(e) {
  var key = e.keyCode || e.charCode;

  if( key !== 8 && key !== 46 ) {
    var indexOfNext = parseInt(e.target.id.split('-')[2]) + 1;
    if(indexOfNext < 30) {
      inputs[indexOfNext].focus();
    }
  }
}

function clickLetter(e) {
  var activeInput = null;
  var activeIndex = null;

  inputs.forEach((input,i) => {
    if(input.id.includes(`-${currentRow}-`) && !input.value && !activeInput) {
      activeInput = input;
      activeIndex = i;
    }
  });
  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      setTimeout(declareWinner, 500);
    } else {
      if(currentRow === 6){
        setTimeout(declareLoser, 500);
      }else {
        changeRow();
      }
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

function checkIsWord() {
  guess = '';

  inputs.forEach(input => {
    if(input.id.includes(`-${currentRow}-`)) {
      guess += input.value;
    }
  })

  return words.includes(guess);
}

function compareGuess() {
  var guessLetters = guess.split('');

  guessLetters.forEach((guessLetter, i) => {
    if (winningWord.includes(guessLetter) && winningWord.split('')[i] !== guessLetter) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(guessLetter, 'wrong-location-key');
    } else if (winningWord.split('')[i] === guessLetter) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(guessLetter, 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(guessLetter, 'wrong-key');
    }
  })
}

function updateBoxColor(letterLocation, className) {
  var row = [];

  inputs.forEach(input => {
    if(input.id.includes(`-${currentRow}-`)) {
      row.push(input);
    }
  });

  row[letterLocation].classList.add(className);
}

function updateKeyColor(letter, className) {
  var keyLetter = null;

  keyLetters.forEach(keyLetterLoop => {
    if (keyLetterLoop.innerText === letter) {
      keyLetter = keyLetterLoop;
    }
  });

  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function declareWinner() {
  recordGameStats(true);
  changeGameOverText();
  viewGameOverMessage(true);
  setTimeout(startNewGame, 4000);
}

function declareLoser() {
  recordGameStats(false);
  viewGameOverMessage(false);
  setTimeout(startNewGame, 4000);
}

function recordGameStats(won) {
  fetch('http://localhost:3001/api/v1/games', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ solved: won, guesses: currentRow })
  })
}

function changeGameOverText() {
  gameOverGuessCount.innerText = currentRow;
  if (currentRow < 2) {
    gameOverGuessGrammar.classList.add('collapsed');
  } else {
    gameOverGuessGrammar.classList.remove('collapsed');
  }
}

function startNewGame() {
  clearGameBoard();
  clearKey();
  setGame();
  viewGame();
  inputs[0].focus();
}

function clearGameBoard() {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct-location', 'wrong-location', 'wrong');
  });
}

function clearKey() {
  keyLetters.forEach(keyLetter => keyLetter.classList.remove('correct-location-key', 'wrong-location-key', 'wrong-key'));
}

// Change Page View Functions

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  gameOverBox.classList.add('collapsed');
  gameLostBox.classList.add('collapsed');
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function viewStats() {
  fetch('http://localhost:3001/api/v1/games')
    .then(response => response.json())
    .then(gamesPlayed => {
      console.log(gamesPlayed)
      changeStatsText(gamesPlayed);
      letterKey.classList.add('hidden');
      gameBoard.classList.add('collapsed');
      rules.classList.add('collapsed');
      stats.classList.remove('collapsed');
      viewGameButton.classList.remove('active');
      viewRulesButton.classList.remove('active');
      viewStatsButton.classList.add('active');
    })
}

function viewGameOverMessage(won) {
  if(won) {
    gameOverBox.classList.remove('collapsed');
  }else {
    gameLostBox.classList.remove('collapsed');
  }
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
}

function changeStatsText(gamesPlayed) {
  if(gamesPlayed.length) {
    statsTotalGames.innerText = gamesPlayed.length;
    statsPercentCorrect.innerText = Math.round((gamesPlayed.filter(game => game.solved).length / gamesPlayed.length) * 100)
    statsAverageGuesses.innerText = Math.round(gamesPlayed.reduce((acc, game) => {
      acc += game.numGuesses;
      return acc;
    }, 0) / gamesPlayed.length);
  } else {
    statsTotalGames.innerText = '0';
    statsPercentCorrect.innerText = '';
    statsAverageGuesses.innerText = '';
  }
}
