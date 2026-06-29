const maxGuesses = 7;
let targetStar = null;
let guesses = [];

const elements = {
  startScreen: document.getElementById('start-screen'),
  gameScreen: document.getElementById('game-screen'),
  starCount: document.getElementById('star-count'),
  startButton: document.getElementById('start-button'),
  guessCount: document.getElementById('guess-count'),
  topHint: document.getElementById('top-hint'),
  tableSection: document.getElementById('table-section'),
  guessesList: document.getElementById('guesses-list'),
  candidatesDropdown: document.getElementById('candidates-dropdown'),
  guessInput: document.getElementById('guess-input'),
  submitButton: document.getElementById('submit-button'),
  errorMsg: document.getElementById('error-msg'),
  resultArea: document.getElementById('result-area'),
  resultWin: document.getElementById('result-win'),
  resultLose: document.getElementById('result-lose'),
  answerShow: document.getElementById('answer-show'),
  answerDetail: document.getElementById('answer-detail'),
  loseAnswerShow: document.getElementById('lose-answer-show'),
  loseAnswerDetail: document.getElementById('lose-answer-detail'),
  guessSummary: document.getElementById('guess-summary'),
  restartButton: document.getElementById('restart-button'),
  backButton: document.getElementById('back-button')
};

function init() {
  elements.starCount.textContent = window.stars.length;
  elements.startButton.addEventListener('click', showGameScreen);
  elements.submitButton.addEventListener('click', onSubmit);
  elements.restartButton.addEventListener('click', startNewGame);
  elements.backButton.addEventListener('click', showStartScreen);
  elements.guessInput.addEventListener('input', onInput);
  elements.guessInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  });
  startNewGame();
}

function showStartScreen() {
  elements.startScreen.classList.remove('hidden');
  elements.gameScreen.classList.add('hidden');
  elements.resultArea.classList.add('hidden');
  clearInput();
}

function showGameScreen() {
  elements.startScreen.classList.add('hidden');
  elements.gameScreen.classList.remove('hidden');
  startNewGame();
}

function startNewGame() {
  targetStar = window.getRandomTargetStar();
  guesses = [];
  elements.guessInput.value = '';
  elements.errorMsg.textContent = '';
  elements.candidatesDropdown.innerHTML = '';
  elements.candidatesDropdown.classList.add('hidden');
  elements.resultArea.classList.add('hidden');
  elements.resultWin.classList.add('hidden');
  elements.resultLose.classList.add('hidden');
  elements.tableSection.classList.add('hidden');
  updateGuessCount();
  updateTopHint();
  renderGuesses();
}

function updateGuessCount() {
  const nextAttempt = guesses.length + 1;
  elements.guessCount.textContent = `${nextAttempt > maxGuesses ? maxGuesses : nextAttempt}/${maxGuesses}`;
}

function updateTopHint() {
  if (guesses.length === 0) {
    elements.topHint.textContent = '👇 输入球星名字开始猜测';
  } else {
    elements.topHint.textContent = '继续猜测，看看你还能不能更快命中。';
  }
}

function onInput(event) {
  const value = event.target.value.trim();
  elements.errorMsg.textContent = '';
  if (!value) {
    elements.candidatesDropdown.innerHTML = '';
    elements.candidatesDropdown.classList.add('hidden');
    return;
  }

  const excludeIds = guesses.map(item => item.star.id);
  const results = window.searchStars(value, excludeIds);
  if (results.length === 0) {
    elements.candidatesDropdown.innerHTML = '';
    elements.candidatesDropdown.classList.add('hidden');
    return;
  }

  elements.candidatesDropdown.innerHTML = results.map((candidate, index) => {
    return `
      <div class="candidate-item" data-index="${index}">
        <div class="candidate-name">${candidate.name}</div>
        <div class="candidate-en">${candidate.nameEn}</div>
        <div class="candidate-country">${candidate.country}</div>
      </div>`;
  }).join('');
  elements.candidatesDropdown.classList.remove('hidden');
  Array.from(elements.candidatesDropdown.children).forEach(item => {
    item.addEventListener('click', () => {
      const index = Number(item.dataset.index);
      selectCandidate(results[index]);
    });
  });
}

function selectCandidate(candidate) {
  elements.guessInput.value = candidate.nameEn;
  elements.candidatesDropdown.innerHTML = '';
  elements.candidatesDropdown.classList.add('hidden');
  doGuess(candidate);
}

function onSubmit() {
  const keyword = elements.guessInput.value.trim();
  if (!keyword) {
    elements.errorMsg.textContent = '请输入球星名字';
    return;
  }

  const excludeIds = guesses.map(item => item.star.id);
  const results = window.searchStars(keyword, excludeIds);
  if (results.length === 0) {
    elements.errorMsg.textContent = '未找到该球星，请检查名字后重试';
    return;
  }

  doGuess(results[0]);
}

function doGuess(guessed) {
  const alreadyGuessed = guesses.some(item => item.star.id === guessed.id);
  if (alreadyGuessed) {
    elements.errorMsg.textContent = '这个球星已经猜过了，试试别人~';
    return;
  }

  elements.errorMsg.textContent = '';
  const comparison = buildComparison(guessed, targetStar);
  const isCorrect = comparison.name.match;
  guesses.push({ star: guessed, comparison });
  elements.guessInput.value = '';
  elements.candidatesDropdown.innerHTML = '';
  elements.candidatesDropdown.classList.add('hidden');

  renderGuesses();
  updateGuessCount();
  updateTopHint();

  if (isCorrect) {
    showResult(true);
  } else if (guesses.length >= maxGuesses) {
    showResult(false);
  }
}

function buildComparison(guessed, target) {
  const ageDiff = guessed.age - target.age;
  const wcDiff = guessed.worldCupWins - target.worldCupWins;
  return {
    name: {
      match: guessed.id === target.id,
      value: guessed.name
    },
    country: {
      match: guessed.country === target.country,
      value: guessed.country,
      targetValue: target.country
    },
    continent: {
      match: guessed.continent === target.continent,
      value: guessed.continent
    },
    worldCupWins: {
      match: guessed.worldCupWins === target.worldCupWins,
      value: guessed.worldCupWins,
      diff: wcDiff
    },
    age: {
      match: guessed.age === target.age,
      value: guessed.age,
      diff: ageDiff
    }
  };
}

function renderGuesses() {
  if (guesses.length === 0) {
    elements.tableSection.classList.add('hidden');
    elements.guessesList.innerHTML = '';
    return;
  }

  elements.tableSection.classList.remove('hidden');
  elements.guessesList.innerHTML = guesses.map(item => {
    const comparison = item.comparison;
    const wcClass = comparison.worldCupWins.match ? 'match' : comparison.worldCupWins.diff > 0 ? 'higher' : comparison.worldCupWins.diff < 0 ? 'lower' : '';
    const ageClass = comparison.age.match ? 'match' : comparison.age.diff > 0 ? 'higher' : comparison.age.diff < 0 ? 'lower' : '';
    return `
      <div class="guess-row ${comparison.name.match ? 'correct' : ''}">
        <div class="col col-name">${item.star.name}</div>
        <div class="col col-country"><span class="cell-value ${comparison.country.match ? 'match' : 'nomatch'}">${item.star.country}</span></div>
        <div class="col col-continent"><span class="cell-value ${comparison.continent.match ? 'match' : 'nomatch'}">${item.star.continent}</span></div>
        <div class="col col-wc"><span class="cell-value ${wcClass}">${item.star.worldCupWins}次${comparison.worldCupWins.match ? '' : `<span class="arrow">${comparison.worldCupWins.diff > 0 ? '⬇️' : '⬆️'}</span>`}</span></div>
        <div class="col col-age"><span class="cell-value ${ageClass}">${item.star.age}岁${comparison.age.match ? '' : `<span class="arrow">${comparison.age.diff > 0 ? '⬇️' : '⬆️'}</span>`}</span></div>
      </div>`;
  }).join('');
}

function showResult(won) {
  elements.resultArea.classList.remove('hidden');
  elements.resultWin.classList.toggle('hidden', !won);
  elements.resultLose.classList.toggle('hidden', won);
  if (won) {
    elements.answerShow.textContent = `${targetStar.name}（${targetStar.nameEn}）`;
    elements.answerDetail.textContent = `${targetStar.country} · ${targetStar.continent} · ${targetStar.worldCupWins}次世界杯 · ${targetStar.age}岁`;
    elements.guessSummary.textContent = `用了 ${guesses.length} 次猜中`;
  } else {
    elements.loseAnswerShow.textContent = `答案是：${targetStar.name}（${targetStar.nameEn}）`;
    elements.loseAnswerDetail.textContent = `${targetStar.country} · ${targetStar.continent} · ${targetStar.worldCupWins}次世界杯 · ${targetStar.age}岁`;
  }
}

function clearInput() {
  elements.guessInput.value = '';
  elements.errorMsg.textContent = '';
  elements.candidatesDropdown.innerHTML = '';
  elements.candidatesDropdown.classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', init);
