let sessions = {};
function getWords(){ try{ return require('./words.json'); }catch{ return ["ayam","kucing","api"]; } }
async function startWtsGame(sock, from, players){
  const words = getWords();
  const civilianWord = words[Math.floor(Math.random()*words.length)];
  const spyIndex = Math.floor(Math.random()*players.length);
  sessions[from]={ players, spy: players[spyIndex], word: civilianWord, active:true };
  for(let i=0;i<players.length;i++){
    const isSpy = players[i]===players[spyIndex];
    const text = isSpy? `🕵️ Kamu adalah SPY! Kata kunci orang lain: ${civilianWord}` : `✅ Kata kunci kamu: *${civilianWord}*`;
    try{ await sock.sendMessage(players[i],{text}); }catch(e){}
  }
  return sessions[from];
}
function getSession(from){ return sessions[from]; }
function endGame(from){ delete sessions[from]; }
module.exports = { startWtsGame, getSession, endGame, startGame: startWtsGame };