const { loadDB, saveDB, getUser } = require('../database');
const { loadData } = require('../panel');
const { getGame, setGame, endGame } = require('../games');
const { startGame: startWtsGame } = require('../wts');
const { resolveTarget } = require('../utils');

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getSettings() {
  const s = loadData('settings')[0] || {};
  return {
    tekatekiReward: s.tekatekiReward || 100, tekatekiTime: s.tekatekiTime || 60,
    tekagambarReward: s.tekagambarReward || 100, tekagambarTime: s.tekagambarTime || 60,
    susunkataReward: s.susunkataReward || 50, susunkataTime: s.susunkataTime || 60,
    tekalirikReward: s.tekalirikReward || 100, tekalirikTime: s.tekalirikTime || 60,
    mathReward: s.mathReward || 100, mathTime: s.mathTime || 60,
    tekanomborReward: s.tekanomborReward || 100, tekanomborTime: s.tekanomborTime || 60,
    tekabenderaReward: s.tekabenderaReward || 100, tekabenderaTime: s.tekabenderaTime || 60,
    quizReward: s.quizReward || 100, quizTime: s.quizTime || 60,
  };
}
function startTimeout(sock, from, answerText, timeSec) {
  return setTimeout(async () => {
    const g = getGame(from);
    if (g) {
      endGame(from);
      await sock.sendMessage(from, { text: `⏰ Masa habis! Jawapan: *${answerText}*` });
    }
  }, timeSec * 1000);
}

module.exports = {
  '.tekateki': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const riddles = loadData('riddles');
      if (!riddles.length) { await sock.sendMessage(from, { text: '❌ Belum ada teka-teki di panel' }); return; }
      const soalan = randomItem(riddles);
      const set = getSettings();
      setGame(from, { type: 'tekateki', answer: soalan.answer.toLowerCase().trim(), reward: set.tekatekiReward });
      await sock.sendMessage(from, { text: `❓ *Teka-teki* (${set.tekatekiTime}s)\n\n${soalan.question}\n\nReward: ${set.tekatekiReward} coin` });
      startTimeout(sock, from, soalan.answer, set.tekatekiTime);
    }
  },
  '.tekagambar': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const images = loadData('images');
      if (!images.length) { await sock.sendMessage(from, { text: '❌ Belum ada gambar di panel' }); return; }
      const item = randomItem(images);
      const set = getSettings();
      setGame(from, { type: 'tekagambar', answer: item.answer.toLowerCase().trim(), reward: set.tekagambarReward });
      try {
        const res = await fetch(item.imageUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        await sock.sendMessage(from, { image: buffer, caption: `🖼️ Teka gambar ni apa! (${set.tekagambarTime}s) | Reward: ${set.tekagambarReward}` });
        startTimeout(sock, from, item.answer, set.tekagambarTime);
      } catch { await sock.sendMessage(from, { text: '❌ Gagal muat gambar.' }); endGame(from); }
    }
  },
  '.susunkata': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const list = loadData('susunkata');
      if (!list.length) { await sock.sendMessage(from, { text: '❌ Belum ada perkataan di panel /susunkata' }); return; }
      const soal = randomItem(list);
      const acak = soal.jawapan.split('').sort(() => 0.5 - Math.random()).join(' ');
      const set = getSettings();
      setGame(from, { type: 'susunkata', answer: soal.jawapan.toLowerCase().trim(), reward: set.susunkataReward });
      await sock.sendMessage(from, { text: `🔤 *SUSUN KATA* (${set.susunkataTime}s)\n\nHuruf: ${acak}\nClue: ${soal.clue}\nReward: ${set.susunkataReward} coin` });
      startTimeout(sock, from, soal.jawapan, set.susunkataTime);
    }
  },
  '.tekalirik': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const lyrics = loadData('lyrics');
      if (!lyrics.length) { await sock.sendMessage(from, { text: '❌ Belum ada lirik di panel.' }); return; }
      const item = randomItem(lyrics);
      const set = getSettings();
      setGame(from, { type: 'tekalirik', answer: item.answer.toLowerCase().trim(), reward: set.tekalirikReward });
      await sock.sendMessage(from, { text: `🎵 *Teka Lirik* (${set.tekalirikTime}s)\n\n${item.lyric}\n\nReward: ${set.tekalirikReward}` });
      startTimeout(sock, from, item.answer, set.tekalirikTime);
    }
  },
  '.math': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const op = randomItem(['+', '-', '*']);
      const jawapan = op === '+'? a + b : op === '-'? a - b : a * b;
      const set = getSettings();
      setGame(from, { type: 'math', answer: String(jawapan), reward: set.mathReward });
      await sock.sendMessage(from, { text: `🔢 ${a} ${op} ${b} =? (${set.mathTime}s) Reward: ${set.mathReward}` });
      startTimeout(sock, from, jawapan, set.mathTime);
    }
  },
  '.tekanombor': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const nombor = Math.floor(Math.random() * 100) + 1;
      const set = getSettings();
      setGame(from, { type: 'tekanombor', answer: String(nombor), reward: set.tekanomborReward });
      await sock.sendMessage(from, { text: `🔢 Saya dah pilih 1-100. Cuba teka! (${set.tekanomborTime}s) Reward: ${set.tekanomborReward}` });
      startTimeout(sock, from, nombor, set.tekanomborTime);
    }
  },
  '.tekabendera': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const senarai = [
        { flag: '🇲🇾', jawapan: 'malaysia' }, { flag: '🇮🇩', jawapan: 'indonesia' },
        { flag: '🇸🇬', jawapan: 'singapura' }, { flag: '🇯🇵', jawapan: 'jepun' },
        { flag: '🇰🇷', jawapan: 'korea selatan' }, { flag: '🇺🇸', jawapan: 'amerika syarikat' },
      ];
      const soalan = randomItem(senarai);
      const set = getSettings();
      setGame(from, { type: 'tekabendera', answer: soalan.jawapan, reward: set.tekabenderaReward });
      await sock.sendMessage(from, { text: `🏳️ Bendera apa ni?\n\n${soalan.flag}\n\nMasa: ${set.tekabenderaTime}s Reward: ${set.tekabenderaReward}` });
      startTimeout(sock, from, soalan.jawapan, set.tekabenderaTime);
    }
  },
  '.curi': { /* kekalkan kod curi kau yang lama */
    level: 'all',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      if (!target) { await sock.sendMessage(from, { text: 'Tag orang yang nak dicuri.' }); return; }
      if (target === sender) { await sock.sendMessage(from, { text: '❌ Tak boleh curi diri sendiri!' }); return; }
      const db = loadDB();
      const pencuri = getUser(db, sender, msg.pushName);
      const mangsa = getUser(db, target);
      const cooldownMs = 2 * 60 * 60 * 1000;
      const lastCuri = pencuri.lastCuri || 0;
      if (Date.now() - lastCuri < cooldownMs) {
        const baki = cooldownMs - (Date.now() - lastCuri);
        await sock.sendMessage(from, { text: `⏳ Cooldown! ${Math.floor(baki/3600000)}j ${Math.floor((baki%3600000)/60000)}m lagi.` }); return;
      }
      pencuri.lastCuri = Date.now();
      if (Math.random() >= 0.4) { saveDB(db); await sock.sendMessage(from, { text: `❌ Mencuri GAGAL!` }); return; }
      const dicuri = Math.floor(mangsa.coin * (0.10 + Math.random() * 0.10));
      mangsa.coin -= dicuri; pencuri.coin += dicuri; saveDB(db);
      await sock.sendMessage(from, { text: `💰 BERJAYA! ${pencuri.name} curi ${dicuri} coin dari ${mangsa.name}!` });
    }
  },
  '.wts': {
    level: 1,
    handler: async (sock, from, sender, msg) => {
      const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const players = [...new Set([sender,...mentions])];
      if (players.length < 2) { await sock.sendMessage(from, { text: '❌ Min 2 player. Contoh:.wts @player' }); return; }
      const { startWtsGame } = require('../wts');
      await startWtsGame(sock, from, players);
      await sock.sendMessage(from, { text: `🕵️ Game dimulakan ${players.length} pemain!`, mentions: players });
    }
  },
  '.quizsej': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const quiz = loadData('quiz').filter(q => q.category === 'sejarah');
      if (!quiz.length) { await sock.sendMessage(from, { text: '❌ Belum ada soalan Sejarah.' }); return; }
      const soalan = randomItem(quiz);
      const set = getSettings();
      setGame(from, { type: 'quiz', answer: soalan.answer.toLowerCase().trim(), reward: set.quizReward });
      await sock.sendMessage(from, { text: `📝 *Quiz Sejarah* (${set.quizTime}s)\n\n${soalan.question}\nReward: ${set.quizReward}` });
      startTimeout(sock, from, soalan.answer, set.quizTime);
    }
  },
  '.quizstem': {
    level: 'all',
    handler: async (sock, from) => {
      if (getGame(from)) { await sock.sendMessage(from, { text: '❌ Game lain tengah jalan!' }); return; }
      const quiz = loadData('quiz').filter(q => q.category === 'stem');
      if (!quiz.length) { await sock.sendMessage(from, { text: '❌ Belum ada soalan STEM.' }); return; }
      const soalan = randomItem(quiz);
      const set = getSettings();
      setGame(from, { type: 'quiz', answer: soalan.answer.toLowerCase().trim(), reward: set.quizReward });
      await sock.sendMessage(from, { text: `📝 *Quiz STEM* (${set.quizTime}s)\n\n${soalan.question}\nReward: ${set.quizReward}` });
      startTimeout(sock, from, soalan.answer, set.quizTime);
    }
  },
}