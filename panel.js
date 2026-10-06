const express = require('express');
const fs = require('fs');
const path = require('path');

function filePath(name) {
  return path.join(__dirname, `${name}.json`);
}

function loadData(name) {
  const p = filePath(name);
  if (!fs.existsSync(p)) {
    if(name === 'quotes') fs.writeFileSync(p, JSON.stringify({ quotes: [], bijak: [], nasihat: [] }, null, 2));
    else if(name === 'settings') fs.writeFileSync(p, JSON.stringify([{ susunkataReward: 50, susunkataTime: 60, tekatekiReward: 100, tekatekiTime: 60, tekagambarReward: 100, tekagambarTime: 60, tekalirikReward: 100, tekalirikTime: 60, mathReward: 100, mathTime: 60, tekanomborReward: 100, tekanomborTime: 60, tekabenderaReward: 100, tekabenderaTime: 60, quizReward: 100, quizTime: 60 }], null, 2));
    else fs.writeFileSync(p, JSON.stringify([], null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    if(name === 'quotes') return { quotes: [], bijak: [], nasihat: [] };
    if(name === 'settings') return [{ susunkataReward: 50, susunkataTime: 60, tekatekiReward: 100, tekatekiTime: 60, tekagambarReward: 100, tekagambarTime: 60, tekalirikReward: 100, tekalirikTime: 60, mathReward: 100, mathTime: 60, tekanomborReward: 100, tekanomborTime: 60, tekabenderaReward: 100, tekabenderaTime: 60, quizReward: 100, quizTime: 60 }];
    return [];
  }
}

function saveData(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

function nav(active) {
  const items = [
    { key: 'words', label: '🕵️ Spy Words', href: '/' },
    { key: 'riddles', label: '❓ Teka-teki', href: '/riddles' },
    { key: 'images', label: '🖼️ Teka Gambar', href: '/images' },
    { key: 'lyrics', label: '🎵 Teka Lirik', href: '/lyrics' },
    { key: 'quiz', label: '📝 Quiz', href: '/quiz' },
    { key: 'truthdare', label: '💬 Truth/Dare', href: '/truthdare' },
    { key: 'quotes', label: '💬 Quotes', href: '/quotes' },
    { key: 'susunkata', label: '🔤 Susun Kata', href: '/susunkata' },
    { key: 'settings', label: '⚙️ Settings Game', href: '/settings' },
    { key: 'ranks', label: '🎖️ Ranks', href: '/ranks' },
    { key: 'levelprices', label: '💵 Harga Level', href: '/levelprices' },
  ];
  return `<nav style="margin-bottom:20px;">${items.map(i =>
    `<a href="${i.href}" style="margin-right:15px; ${i.key === active? 'font-weight:bold; text-decoration:underline;' : ''}">${i.label}</a>`
  ).join('')}</nav>`;
}

function layout(active, title, body) {
  return `
    <html>
    <head><title>${title}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="font-family: sans-serif; max-width: 900px; margin: 40px auto; padding:0 15px;">
      ${nav(active)}
      <h2>${title}</h2>
      ${body}
    </body>
    </html>
  `;
}

function startPanel(port = 3000) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/ranks', (req, res) => {
    const items = loadData('ranks').sort((a,b)=>a.minLevel - b.minLevel);
    const rows = items.map(r => `<tr><td>${r.id}</td><td>${r.emoji}</td><td>${r.name}</td><td>${r.minLevel}-${r.maxLevel}</td><td><a href="/ranks/edit/${r.id}">✏️</a> <a href="/ranks/delete/${r.id}" style="margin-left:8px;">🗑️</a></td></tr>`).join('');
    res.send(layout('ranks', '🎖️ Ranks', `<form method="POST" action="/ranks/add"><input name="emoji" placeholder="💀" required style="width:60px;" value="💀"><input name="name" placeholder="Nama Pangkat" required style="width:200px;"><input name="minLevel" type="number" placeholder="Min" required style="width:80px;"><input name="maxLevel" type="number" placeholder="Max" required style="width:80px;" value="9999"><button>Tambah</button></form><br><table border="1" cellpadding="8" style="border-collapse:collapse; width:100%;"><tr><th>ID</th><th>Emoji</th><th>Nama</th><th>Julat</th><th>Aksi</th></tr>${rows}</table>`));
  });
  app.post('/ranks/add', (req, res) => { const items = loadData('ranks'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, emoji: req.body.emoji, name: req.body.name, minLevel: parseInt(req.body.minLevel), maxLevel: parseInt(req.body.maxLevel) }); saveData('ranks', items); res.redirect('/ranks'); });
  app.get('/ranks/delete/:id', (req, res) => { saveData('ranks', loadData('ranks').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/ranks'); });
  app.get('/ranks/edit/:id', (req, res) => { const items = loadData('ranks'); const r = items.find(i => i.id === parseInt(req.params.id)); if(!r) return res.redirect('/ranks'); res.send(layout('ranks', `Edit Rank #${r.id}`, `<form method="POST" action="/ranks/update/${r.id}"><input name="emoji" value="${r.emoji}" required style="width:60px;"><input name="name" value="${r.name}" required style="width:200px;"><input name="minLevel" type="number" value="${r.minLevel}" required style="width:80px;"><input name="maxLevel" type="number" value="${r.maxLevel}" required style="width:80px;"><button>Update</button></form>`)); });
  app.post('/ranks/update/:id', (req, res) => { const items = loadData('ranks'); const idx = items.findIndex(i => i.id === parseInt(req.params.id)); if(idx!== -1){ items[idx].emoji = req.body.emoji; items[idx].name = req.body.name; items[idx].minLevel = parseInt(req.body.minLevel); items[idx].maxLevel = parseInt(req.body.maxLevel); saveData('ranks', items); } res.redirect('/ranks'); });

  app.get('/levelprices', (req, res) => {
    const items = loadData('levelprices').sort((a,b)=>a.minLevel - b.minLevel);
    const rows = items.map(p => `<tr><td>${p.id}</td><td>${p.minLevel}-${p.maxLevel}</td><td>${p.price}</td><td><a href="/levelprices/delete/${p.id}">🗑️</a></td></tr>`).join('');
    res.send(layout('levelprices', '💵 Harga Level', `<p>Set harga sampai 100 sahaja.</p><form method="POST" action="/levelprices/add"><input name="minLevel" type="number" placeholder="Dari" required><input name="maxLevel" type="number" placeholder="Ke" required value="100"><input name="price" type="number" placeholder="Harga coin" required><button>Tambah</button></form><br><table border="1" cellpadding="8" style="border-collapse:collapse; width:100%;"><tr><th>ID</th><th>Julat</th><th>Harga</th><th>Aksi</th></tr>${rows}</table>`));
  });
  app.post('/levelprices/add', (req, res) => { const items = loadData('levelprices'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, minLevel: parseInt(req.body.minLevel), maxLevel: parseInt(req.body.maxLevel), price: parseInt(req.body.price) }); saveData('levelprices', items); res.redirect('/levelprices'); });
  app.get('/levelprices/delete/:id', (req, res) => { saveData('levelprices', loadData('levelprices').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/levelprices'); });

  app.get('/', (req, res) => {
    const words = loadData('words');
    const rows = words.map(w => `<tr><td>${w.id}</td><td>${w.word1}</td><td>${w.word2}</td><td>${w.imageUrl? `<img src="${w.imageUrl}" style="max-width:60px">` : '-'}</td><td><a href="/words/delete/${w.id}">🗑️</a></td></tr>`).join('');
    res.send(layout('words', "🕵️ Spy Words + Gambar", `<form method="POST" action="/words/add"><input name="word1" placeholder="Safe" required><input name="word2" placeholder="Spy" required><input name="imageUrl" placeholder="URL Gambar (optional)" style="width:40%"><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Safe</th><th>Spy</th><th>Gambar</th><th>Aksi</th></tr>${rows}</table>`));
  });
  app.post('/words/add', (req, res) => { const words = loadData('words'); const newId = words.length? Math.max(...words.map(w => w.id)) + 1 : 1; words.push({ id: newId, word1: req.body.word1, word2: req.body.word2, imageUrl: req.body.imageUrl || '' }); saveData('words', words); res.redirect('/'); });
  app.get('/words/delete/:id', (req, res) => { saveData('words', loadData('words').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/'); });

  app.get('/riddles', (req, res) => { const items = loadData('riddles'); const rows = items.map(r => `<tr><td>${r.id}</td><td>${r.question}</td><td>${r.answer}</td><td><a href="/riddles/delete/${r.id}">🗑️</a></td></tr>`).join(''); res.send(layout('riddles', '❓ Teka-teki', `<form method="POST" action="/riddles/add"><input name="question" placeholder="Soalan" required style="width:60%;"><input name="answer" placeholder="Jawapan" required><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Soalan</th><th>Jawapan</th><th>Aksi</th></tr>${rows}</table>`)); });
  app.post('/riddles/add', (req, res) => { const items = loadData('riddles'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, question: req.body.question, answer: req.body.answer }); saveData('riddles', items); res.redirect('/riddles'); });
  app.get('/riddles/delete/:id', (req, res) => { saveData('riddles', loadData('riddles').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/riddles'); });

  app.get('/images', (req, res) => { const items = loadData('images'); const rows = items.map(i => `<tr><td>${i.id}</td><td><img src="${i.imageUrl}" style="max-width:80px;"></td><td>${i.answer}</td><td><a href="/images/delete/${i.id}">🗑️</a></td></tr>`).join(''); res.send(layout('images', '🖼️ Teka Gambar', `<form method="POST" action="/images/add"><input name="imageUrl" placeholder="URL" required style="width:60%;"><input name="answer" placeholder="Jawapan" required><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Preview</th><th>Jawapan</th><th>Aksi</th></tr>${rows}</table>`)); });
  app.post('/images/add', (req, res) => { const items = loadData('images'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, imageUrl: req.body.imageUrl, answer: req.body.answer }); saveData('images', items); res.redirect('/images'); });
  app.get('/images/delete/:id', (req, res) => { saveData('images', loadData('images').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/images'); });

  app.get('/lyrics', (req, res) => { const items = loadData('lyrics'); const rows = items.map(l => `<tr><td>${l.id}</td><td>${l.lyric}</td><td>${l.answer}</td><td><a href="/lyrics/delete/${l.id}">🗑️</a></td></tr>`).join(''); res.send(layout('lyrics', '🎵 Teka Lirik', `<form method="POST" action="/lyrics/add"><textarea name="lyric" placeholder="Lirik ___" required style="width:100%; height:60px;"></textarea><br><input name="answer" placeholder="Jawapan" required><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Lirik</th><th>Jawapan</th><th>Aksi</th></tr>${rows}</table>`)); });
  app.post('/lyrics/add', (req, res) => { const items = loadData('lyrics'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, lyric: req.body.lyric, answer: req.body.answer }); saveData('lyrics', items); res.redirect('/lyrics'); });
  app.get('/lyrics/delete/:id', (req, res) => { saveData('lyrics', loadData('lyrics').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/lyrics'); });

  app.get('/quiz', (req, res) => { const items = loadData('quiz'); const rows = items.map(q => `<tr><td>${q.id}</td><td>${q.category}</td><td>${q.question}</td><td>${q.answer}</td><td><a href="/quiz/delete/${q.id}">🗑️</a></td></tr>`).join(''); res.send(layout('quiz', '📝 Quiz', `<form method="POST" action="/quiz/add"><select name="category"><option value="sejarah">Sejarah</option><option value="stem">STEM</option></select><input name="question" placeholder="Soalan" required style="width:50%;"><input name="answer" placeholder="Jawapan" required><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Kat</th><th>Soalan</th><th>Jawapan</th><th>Aksi</th></tr>${rows}</table>`)); });
  app.post('/quiz/add', (req, res) => { const items = loadData('quiz'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, category: req.body.category, question: req.body.question, answer: req.body.answer }); saveData('quiz', items); res.redirect('/quiz'); });
  app.get('/quiz/delete/:id', (req, res) => { saveData('quiz', loadData('quiz').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/quiz'); });

  app.get('/truthdare', (req, res) => { const items = loadData('truthdare'); const rows = items.map(t => `<tr><td>${t.id}</td><td>${t.type}</td><td>${t.text}</td><td><a href="/truthdare/delete/${t.id}">🗑️</a></td></tr>`).join(''); res.send(layout('truthdare', '💬 Truth / Dare', `<form method="POST" action="/truthdare/add"><select name="type"><option value="truth">Truth</option><option value="dare">Dare</option></select><input name="text" placeholder="Ayat" required style="width:60%;"><button>Tambah</button></form><br><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>ID</th><th>Jenis</th><th>Ayat</th><th>Aksi</th></tr>${rows}</table>`)); });
  app.post('/truthdare/add', (req, res) => { const items = loadData('truthdare'); const newId = items.length? Math.max(...items.map(i => i.id)) + 1 : 1; items.push({ id: newId, type: req.body.type, text: req.body.text }); saveData('truthdare', items); res.redirect('/truthdare'); });
  app.get('/truthdare/delete/:id', (req, res) => { saveData('truthdare', loadData('truthdare').filter(i => i.id!== parseInt(req.params.id))); res.redirect('/truthdare'); });

  app.get('/quotes', (req, res) => {
    const data = loadData('quotes');
    const makeRows = (arr, type) => arr.map((t,i) => `<tr><td>${i}</td><td>${t}</td><td><a href="/quotes/delete/${type}/${i}">🗑️</a></td></tr>`).join('');
    res.send(layout('quotes', '💬 Quotes / Bijak / Nasihat', `<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px;"><div><h3>💬 Quotes</h3><form method="POST" action="/quotes/add"><input type="hidden" name="type" value="quotes"><textarea name="text" placeholder="Ayat quotes baru" required style="width:100%; height:60px;"></textarea><br><button>Tambah Quotes</button></form><table border="1" cellpadding="6" style="width:100%; border-collapse:collapse; margin-top:10px;"><tr><th>#</th><th>Ayat</th><th></th></tr>${makeRows(data.quotes||[], 'quotes')}</table></div><div><h3>🧠 Bijak</h3><form method="POST" action="/quotes/add"><input type="hidden" name="type" value="bijak"><textarea name="text" placeholder="Ayat bijak baru" required style="width:100%; height:60px;"></textarea><br><button>Tambah Bijak</button></form><table border="1" cellpadding="6" style="width:100%; border-collapse:collapse; margin-top:10px;"><tr><th>#</th><th>Ayat</th><th></th></tr>${makeRows(data.bijak||[], 'bijak')}</table></div><div><h3>🤲 Nasihat</h3><form method="POST" action="/quotes/add"><input type="hidden" name="type" value="nasihat"><textarea name="text" placeholder="Ayat nasihat baru" required style="width:100%; height:60px;"></textarea><br><button>Tambah Nasihat</button></form><table border="1" cellpadding="6" style="width:100%; border-collapse:collapse; margin-top:10px;"><tr><th>#</th><th>Ayat</th><th></th></tr>${makeRows(data.nasihat||[], 'nasihat')}</table></div></div>`));
  });
  app.post('/quotes/add', (req, res) => { const data = loadData('quotes'); const type = req.body.type; if(!data[type]) data[type]=[]; data[type].push(req.body.text); saveData('quotes', data); res.redirect('/quotes'); });
  app.get('/quotes/delete/:type/:index', (req, res) => { const data = loadData('quotes'); const type = req.params.type; const idx = parseInt(req.params.index); if(data[type]) data[type].splice(idx,1); saveData('quotes', data); res.redirect('/quotes'); });

  app.get('/susunkata', (req, res) => {
    const items = loadData('susunkata');
    const rows = items.map((s,i) => `<tr><td>${i+1}</td><td>${s.jawapan}</td><td>${s.clue}</td><td><a href="/susunkata/delete/${i}">🗑️ Delete</a></td></tr>`).join('');
    res.send(layout('susunkata', '🔤 Susun Kata', `<form method="POST" action="/susunkata/add" style="margin-bottom:20px;"><input name="jawapan" placeholder="Jawapan (cth: BUKU)" required><input name="clue" placeholder="Clue" required style="width:40%;"><button>Tambah</button></form><table border="1" cellpadding="8" style="width:100%; border-collapse:collapse;"><tr><th>#</th><th>Jawapan</th><th>Clue</th><th>Aksi</th></tr>${rows || '<tr><td colspan=4 style="text-align:center;">Belum ada</td></tr>'}</table><p><a href="/settings">⚙️ Set masa & reward di Settings</a></p>`));
  });
  app.post('/susunkata/add', (req, res) => { const items = loadData('susunkata'); items.push({ jawapan: req.body.jawapan.toUpperCase().trim(), clue: req.body.clue.trim() }); saveData('susunkata', items); res.redirect('/susunkata'); });
  app.get('/susunkata/delete/:index', (req, res) => { const items = loadData('susunkata'); items.splice(parseInt(req.params.index), 1); saveData('susunkata', items); res.redirect('/susunkata'); });

  app.get('/settings', (req, res) => {
    const s = loadData('settings')[0] || {};
    res.send(layout('settings', '⚙️ Settings - Masa & Reward Semua Game', `
      <form method="POST" action="/settings/save" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; max-width:700px;">
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>❓ Teka-teki</h4>Reward: <input type="number" name="tekatekiReward" value="${s.tekatekiReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="tekatekiTime" value="${s.tekatekiTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🖼️ Teka Gambar</h4>Reward: <input type="number" name="tekagambarReward" value="${s.tekagambarReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="tekagambarTime" value="${s.tekagambarTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🔤 Susun Kata</h4>Reward: <input type="number" name="susunkataReward" value="${s.susunkataReward||50}" style="width:80px;"><br>Masa(s): <input type="number" name="susunkataTime" value="${s.susunkataTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🎵 Teka Lirik</h4>Reward: <input type="number" name="tekalirikReward" value="${s.tekalirikReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="tekalirikTime" value="${s.tekalirikTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🔢 Math</h4>Reward: <input type="number" name="mathReward" value="${s.mathReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="mathTime" value="${s.mathTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🔢 Teka Nombor</h4>Reward: <input type="number" name="tekanomborReward" value="${s.tekanomborReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="tekanomborTime" value="${s.tekanomborTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>🏳️ Teka Bendera</h4>Reward: <input type="number" name="tekabenderaReward" value="${s.tekabenderaReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="tekabenderaTime" value="${s.tekabenderaTime||60}" style="width:80px;"></div>
        <div style="background:#f0f0f0; padding:12px; border-radius:8px;"><h4>📝 Quiz</h4>Reward: <input type="number" name="quizReward" value="${s.quizReward||100}" style="width:80px;"><br>Masa(s): <input type="number" name="quizTime" value="${s.quizTime||60}" style="width:80px;"></div>
        <div style="grid-column:1/3;"><button type="submit" style="padding:10px 25px; background:black; color:white; border:none; border-radius:6px;">💾 Simpan Semua Setting</button></div>
      </form>
    `));
  });
  app.post('/settings/save', (req, res) => {
    let settings = loadData('settings');
    if(!settings[0]) settings[0] = {};
    const fields = ['tekatekiReward','tekatekiTime','tekagambarReward','tekagambarTime','susunkataReward','susunkataTime','tekalirikReward','tekalirikTime','mathReward','mathTime','tekanomborReward','tekanomborTime','tekabenderaReward','tekabenderaTime','quizReward','quizTime'];
    fields.forEach(f => { settings[0][f] = parseInt(req.body[f]) || 60; });
    saveData('settings', settings);
    res.redirect('/settings');
  });

  app.listen(port, () => console.log(`Panel jalan di http://localhost:${port}`));
}

module.exports = { startPanel, loadData, saveData };