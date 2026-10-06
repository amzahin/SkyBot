const activeGames = {};

function startGame(groupId, gameData) {
  activeGames[groupId] = gameData;
}

function getGame(groupId) {
  return activeGames[groupId];
}

function endGame(groupId) {
  delete activeGames[groupId];
}

module.exports = { startGame, getGame, endGame };