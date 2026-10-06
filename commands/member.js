const { loadDB, saveDB, getUser } = require('../database');
const { loadData } = require('../panel');

module.exports = {
  '.profile': {
    level: 'all',
  handler: async (sock, from, sender, msg) => {
    const db = loadDB(); const user = getUser(db, sender, msg.pushName); saveDB(db);
    const ranks = loadData('ranks');
    const rankInfo = ranks.find(r => user.level >= r.minLevel && user.level <= r.maxLevel);
    await sock.sendMessage(from, { text: `👤 *Profile*\nNama: ${user.name}\nGender: ${user.gender || '-'}\nUmur: ${user.umur || '-'}\nBio: ${user.bio || '-'}\nCoin: ${user.coin}\nLevel: ${user.level}\nPangkat: ${rankInfo? rankInfo.name : '-'}`
   });
  }
},
  '.claim': {
    level: 'all',
    handler: async (sock, from, sender, msg) => {
      const db = loadDB();
      const user = getUser(db, sender, msg.pushName);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - user.lastClaim < oneDay) {
        const sisa = oneDay - (now - user.lastClaim);
        await sock.sendMessage(from, { text: `⏳ Dah claim hari ini. Cuba lagi dalam ${Math.floor(sisa / 3600000)}j ${Math.floor((sisa % 3600000) / 60000)}m.` });
        return;
      }
      user.coin += 100;
      user.lastClaim = now;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ +100 coin!\nCoin sekarang: ${user.coin}` });
    }
  },
  '.listbrg': {
    level: 'all',
    handler: async (sock, from) => {
      const db = loadDB();
      let text = '🛒 *Senarai Barang*\n\n';
      for (const [key, item] of Object.entries(db.shop)) {
        text += `• ${item.name}\n  Kod: ${key} | Harga: ${item.price} coin\n\n`;
      }
      text += 'Cara beli: .buy <kod> <jumlah>';
      await sock.sendMessage(from, { text });
    }
  },
  '.buy': {
    level: 'all',
    handler: async (sock, from, sender, msg, args) => {
      const [itemKey, jumlahStr] = args;
      const jumlah = parseInt(jumlahStr) || 1;
      const db = loadDB();
      const item = db.shop[itemKey];
      if (!item) { await sock.sendMessage(from, { text: '❌ Item tak wujud. Guna .listbrg.' }); return; }
      const user = getUser(db, sender, msg.pushName);
      const totalHarga = item.price * jumlah;
      if (user.coin < totalHarga) { await sock.sendMessage(from, { text: `❌ Coin tak cukup. Perlukan ${totalHarga}.` }); return; }
      user.coin -= totalHarga;
      if (item.addLimit) user.limit += item.addLimit * jumlah;
      if (item.level) user.level = Math.max(user.level, item.level);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Berjaya beli ${item.name} x${jumlah}!\nBaki coin: ${user.coin}` });
    }
  },
  '.buylevel': {
    level: 'all',
    handler: async (sock, from, sender, msg) => {
      const db = loadDB();
      const user = getUser(db, sender, msg.pushName);
      if (user.level >= 100) { await sock.sendMessage(from, { text: '🏆 Anda sudah MAX level (100)!' }); return; }
      const prices = loadData('levelprices');
      const nextLevel = user.level + 1;
      const tier = prices.find(p => nextLevel >= p.minLevel && nextLevel <= p.maxLevel);
      if (!tier) { await sock.sendMessage(from, { text: '❌ Harga level seterusnya belum ditetapkan.' }); return; }
      if (user.coin < tier.price) { await sock.sendMessage(from, { text: `❌ Coin tak cukup. Perlukan ${tier.price} untuk Level ${nextLevel}.` }); return; }
      user.coin -= tier.price;
      user.level = nextLevel;
      saveDB(db);
      await sock.sendMessage(from, { text: `🎉 Naik ke Level ${user.level}! Baki coin: ${user.coin}` });
    }
  },
  '.leaderboard': {
    level: 'all',
    handler: async (sock, from) => {
      const db = loadDB();
      const sorted = Object.values(db.users).sort((a, b) => (b.level - a.level) || (b.coin - a.coin)).slice(0, 10);
      let text = '🏆 *Leaderboard*\n\n';
      sorted.forEach((u, i) => { text += `${i + 1}. ${u.name} — Level ${u.level} (${u.coin} coin)\n`; });
      await sock.sendMessage(from, { text });
    }
  },
  '.hargabot': {
    level: 'all',
    handler: async (sock, from) => {
      const db = loadDB();
      await sock.sendMessage(from, { text: `💰 Harga Bot: RM${db.botPrice}\n\nUntuk order, hubungi admin.` });
    }
  },
  '.afk': {
    level: 'all',
    handler: async (sock, from, sender, msg, args) => {
      const db = loadDB();
      const reason = args.join(' ') || null;
      const user = getUser(db, sender, msg.pushName);
      db.afk[sender] = { reason, since: Date.now() };
      saveDB(db);
      await sock.sendMessage(from, { text: `💤 ${user.name} kini AFK${reason ? `: ${reason}` : ''}` });
    }
  },
  '.info': {
    level: 'all',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: 'ℹ️ AI features coming soon.' });
    }
  },
  '.setgender': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const db = loadDB();
    const user = getUser(db, sender, msg.pushName);
    const gender = args[0]?.toLowerCase();
    if (!['lelaki','perempuan','l','p','male','female'].includes(gender)) {
      await sock.sendMessage(from, { text: 'Guna:.setgender lelaki/perempuan' }); return;
    }
    user.gender = gender; saveDB(db);
    await sock.sendMessage(from, { text: `✅ Gender set: ${gender}` });
  }
},
'.setumur': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const db = loadDB(); const user = getUser(db, sender, msg.pushName);
    const umur = parseInt(args[0]);
    if (!umur || umur < 5 || umur > 100) { await sock.sendMessage(from, { text: 'Guna:.setumur 18 (5-100)' }); return; }
    user.umur = umur; saveDB(db);
    await sock.sendMessage(from, { text: `✅ Umur set: ${umur}` });
  }
},
'.setbio': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const db = loadDB(); const user = getUser(db, sender, msg.pushName);
    const bio = args.join(' ').slice(0, 150);
    if (!bio) { await sock.sendMessage(from, { text: 'Guna:.setbio aku budak baik' }); return; }
    user.bio = bio; saveDB(db);
    await sock.sendMessage(from, { text: `✅ Bio set: ${bio}` });
  }
},
'.susunkata': {
  level: 'all',
  handler: async (sock, from, sender, msg) => {
    const { getGame, setGame } = require('../games');
    if (getGame(from)) { await sock.sendMessage(from, { text: 'Game lain tengah jalan!' }); return; }
    const list = loadData('susunkata');
    if (!list.length) { await sock.sendMessage(from, { text: 'Data susunkata kosong, tambah di panel.' }); return; }
    const soal = list[Math.floor(Math.random()*list.length)];
    const acak = soal.jawapan.split('').sort(()=>0.5-Math.random()).join(', ');
    const settings = loadData('settings')[0] || { susunkataReward: 50, susunkataTime: 60 };
    setGame(from, { type: 'susunkata', answer: soal.jawapan.toLowerCase(), reward: settings.susunkataReward });
    await sock.sendMessage(from, { text: `🔤 *SUSUN KATA*\n\nHuruf: ${acak}\nClue: ${soal.clue}\n\nMasa: ${settings.susunkataTime}s\nJawab terus!` });
    setTimeout(async () => {
      const g = getGame(from);
      if (g && g.type === 'susunkata') {
        const { endGame } = require('../games');
        endGame(from);
        await sock.sendMessage(from, { text: `⏰ Masa habis! Jawapan: ${soal.jawapan}` });
      }
    }, settings.susunkataTime * 1000);
  }
},
'.imagine': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const prompt = args.join(' ');
    if (!prompt) { await sock.sendMessage(from, { text: 'Guna:.imagine kucing pakai baju melayu' }); return; }
    await sock.sendMessage(from, { text: '🎨 Generating gambar...' });
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&enhance=true`;
    await sock.sendMessage(from, { image: { url }, caption: `🖼️ ${prompt}` });
  }
},
'.imaginevid': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const prompt = args.join(' ');
    if (!prompt) { await sock.sendMessage(from, { text: 'Guna:.imaginevid naga terbang di KLCC' }); return; }
    await sock.sendMessage(from, { text: '🎬 Generating video (30s)... Free API lambat sikit ya' });
    // pakai free API HuggingFace - Pollinations video
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ' video, cinematic motion')}?nologo=true`;
    // sementara hantar sebagai gambar dulu, kalau nak video betul guna Replicate key nanti
    await sock.sendMessage(from, { image: { url }, caption: `🎬 Video Prompt: ${prompt}\nNote: Free version bagi gambar bergerak. Nak video MP4 betul, nanti letak API Replicate.` });
  }
},
};