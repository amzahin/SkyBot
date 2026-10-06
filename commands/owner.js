const { loadDB, saveDB, getUser, getGroup } = require('../database');
const { resolveTarget } = require('../utils');

module.exports = {
  '.stopbot': {
    level: 'owner',
    handler: async (sock, from) => {
      const db = loadDB();
      db.globalBotActive = false;
      saveDB(db);
      await sock.sendMessage(from, { text: '🛑 Bot dihentikan untuk SEMUA group.' });
    }
  },
  '.startbot': {
    level: 'owner',
    handler: async (sock, from) => {
      const db = loadDB();
      db.globalBotActive = true;
      saveDB(db);
      await sock.sendMessage(from, { text: '✅ Bot diaktifkan semula untuk SEMUA group.' });
    }
  },
  '.botset': {
    level: 'owner',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: '🖥️ Panel Kawalan:\nhttp://localhost:3000' });
    }
  },
  '.addaura': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      const jumlah = parseInt(args[args.length - 1]) || 0;
      if (!target ||!jumlah) { await sock.sendMessage(from, { text: 'Format:.addaura @user <jumlah>' }); return; }
      const db = loadDB();
      const user = getUser(db, target);
      user.aura += jumlah;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ +${jumlah} aura untuk ${user.name}. Aura sekarang: ${user.aura}` });
    }
  },
  '.addduit': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      const jumlah = parseInt(args[args.length - 1]) || 0;
      if (!target ||!jumlah) { await sock.sendMessage(from, { text: 'Format:.addduit @user <jumlah>' }); return; }
      const db = loadDB();
      const user = getUser(db, target);
      user.coin += jumlah;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ +${jumlah} coin untuk ${user.name}. Coin sekarang: ${user.coin}` });
    }
  },
  '.addlvl': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      const jumlah = parseInt(args[args.length - 1]) || 0;
      if (!target ||!jumlah) { await sock.sendMessage(from, { text: 'Format:.addlvl @user <jumlah>' }); return; }
      const db = loadDB();
      const user = getUser(db, target);
      user.level += jumlah;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ +${jumlah} level untuk ${user.name}. Level sekarang: ${user.level}` });
    }
  },
  '.setbotname': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const nama = args.join(' ');
      if (!nama) { await sock.sendMessage(from, { text: 'Format:.setbotname Nama Baru' }); return; }
      const db = loadDB();
      db.botName = nama;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Nama bot ditukar kepada: ${nama}` });
    }
  },
  '.setbotstop': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const [stop, start] = args;
      if (!stop ||!start) { await sock.sendMessage(from, { text: 'Format:.setbotstop <jam_stop> <jam_start>\nContoh:.setbotstop 23:00 07:00' }); return; }
      const db = loadDB();
      getGroup(db, from).activeHours = { stop, start };
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Jadual: OFF ${stop} — ON ${start}` });
    }
  },
  '.addbadword': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const kata = args.join(' ').toLowerCase();
      if (!kata) { await sock.sendMessage(from, { text: 'Format:.addbadword <perkataan>' }); return; }
      const db = loadDB();
      if (!db.badwords.includes(kata)) db.badwords.push(kata);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ "${kata}" ditambah ke badword.` });
    }
  },
  '.delbadword': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const kata = args.join(' ').toLowerCase();
      const db = loadDB();
      db.badwords = db.badwords.filter(w => w!== kata);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ "${kata}" dibuang dari badword.` });
    }
  },
  '.addowner': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const num = (args[0] || '').replace(/[^0-9]/g, '');
      if (!num) { await sock.sendMessage(from, { text: 'Format:.addowner 60123456789' }); return; }
      const db = loadDB();
      const id = `${num}@s.whatsapp.net`;
      if (!db.owners.includes(id)) db.owners.push(id);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ ${num} ditambah sebagai owner.` });
    }
  },
  '.blacklist': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const num = (args[0] || '').replace(/[^0-9]/g, '');
      if (!num) { await sock.sendMessage(from, { text: 'Format:.blacklist 60123456789' }); return; }
      const db = loadDB();
      const id = `${num}@s.whatsapp.net`;
      if (!db.blacklist.includes(id)) db.blacklist.push(id);
      saveDB(db);
      await sock.sendMessage(from, { text: `🚫 ${num} dimasukkan ke blacklist.` });
    }
  },
  '.whitelist': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const num = (args[0] || '').replace(/[^0-9]/g, '');
      const db = loadDB();
      const id = `${num}@s.whatsapp.net`;
      db.blacklist = db.blacklist.filter(w => w!== id);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ ${num} dikeluarkan dari blacklist.` });
    }
  },
  '.setpangkat': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      if (args.length < 2) { await sock.sendMessage(from, { text: 'Format:.setpangkat <minLevel> <maxLevel> <nama>' }); return; }
      const { loadData } = require('../panel');
      const fs = require('fs'); const path = require('path');
      const filePath = path.join(__dirname, '../ranks.json');
      const ranks = loadData('ranks');
      const minLevel = parseInt(args[0]);
      const maxLevel = parseInt(args[1]);
      const name = args.slice(2).join(' ');
      const newId = ranks.length? Math.max(...ranks.map(i=>i.id))+1 : 1;
      ranks.push({ id: newId, emoji: '💀', name: name, minLevel, maxLevel });
      fs.writeFileSync(filePath, JSON.stringify(ranks, null, 2));
      await sock.sendMessage(from, { text: `✅ Pangkat "${name}" untuk Level ${minLevel}-${maxLevel} ditambah!` });
    }
  },
  '.clearacht': {
    level:'owner',
    handler: async(sock,from)=>{
      const fs=require('fs'); const path=require('path');
      const storePath=path.join(__dirname,'../store');
      if(fs.existsSync(storePath)){ fs.rmSync(storePath,{recursive:true,force:true}); }
      await sock.sendMessage(from,{text:'✅ Chat di phone bot dibersihkan. Restart bot.'});
    }
  },
  // ===== FIX: 5 RESET - OWNER SAHAJA =====
  '.reseta': {
    level: 'owner',
    handler: async (sock, from) => {
      saveDB({ users: {}, groups: {}, owners: [], blacklist: [], botName: "Bot", badwords: [] });
      await sock.sendMessage(from, { text: '✅ *RESETEA* Semua data dah padam!' });
    }
  },
  '.resetuser': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      if (!target) return sock.sendMessage(from, { text: 'Guna:.resetuser @user' });
      const db = loadDB();
      if (db.users[target]) {
        delete db.users[target];
        saveDB(db);
        await sock.sendMessage(from, { text: `✅ User @${target.split('@')[0]} reset`, mentions: [target] });
      } else await sock.sendMessage(from, { text: '❌ User tak jumpa' });
    }
  },
  '.resetlimit': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const db = loadDB();
      const target = resolveTarget(msg, args) || sender;
      const user = getUser(db, target);
      user.limit = 100; saveDB(db);
      await sock.sendMessage(from, { text: `✅ Limit @${target.split('@')[0]} reset 100`, mentions: [target] });
    }
  },
  '.resetcoin': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const db = loadDB();
      const target = resolveTarget(msg, args) || sender;
      const user = getUser(db, target);
      user.coin = 0; saveDB(db);
      await sock.sendMessage(from, { text: `✅ Coin @${target.split('@')[0]} reset 0`, mentions: [target] });
    }
  },
  '.resetlevel': {
    level: 'owner',
    handler: async (sock, from, sender, msg, args) => {
      const db = loadDB();
      const target = resolveTarget(msg, args) || sender;
      const user = getUser(db, target);
      user.level = 1; user.xp = 0; saveDB(db);
      await sock.sendMessage(from, { text: `✅ Level @${target.split('@')[0]} reset 1`, mentions: [target] });
    }
  }
};