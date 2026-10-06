const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { loadDB, saveDB, getGroup, getUser } = require('../database');
const { resolveTarget, getQuotedInfo } = require('../utils');

module.exports = {
  '.pausebot': {
    level: 'admin',
    handler: async (sock, from) => {
      const db = loadDB();
      getGroup(db, from).paused = true;
      saveDB(db);
      await sock.sendMessage(from, { text: '⏸️ Bot dijeda untuk group ini.' });
    }
  },
  '.continuebot': {
    level: 'admin',
    handler: async (sock, from) => {
      const db = loadDB();
      getGroup(db, from).paused = false;
      saveDB(db);
      await sock.sendMessage(from, { text: '▶️ Bot disambung semula untuk group ini.' });
    }
  },
  '.removebot': {
    level: 'admin',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: '👋 Bot keluar dari group ini...' });
      await sock.groupLeave(from);
    }
  },
  '.add': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const num = (args[0] || '').replace(/[^0-9]/g, '');
      if (!num) { await sock.sendMessage(from, { text: 'Format:.add 60123456789' }); return; }
      await sock.groupParticipantsUpdate(from, [`${num}@s.whatsapp.net`], 'add');
    }
  },
  '.kick': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      if (!target) { await sock.sendMessage(from, { text: 'Tag atau taip nombor member nak dikick.' }); return; }
      await sock.groupParticipantsUpdate(from, [target], 'remove');
    }
  },
  '.warn': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      if (!target) { await sock.sendMessage(from, { text: 'Tag atau taip nombor member nak diwarn.' }); return; }
      const db = loadDB();
      const group = getGroup(db, from);
      const nama = getUser(db, target).name;
      group.warns[target] = (group.warns[target] || 0) + 1;
      if (group.warns[target] >= 3) {
        saveDB(db);
        await sock.sendMessage(from, { text: `⚠️ ${nama} dah dapat 3 warning — auto kick.` });
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        group.warns[target] = 0;
        saveDB(db);
        return;
      }
      saveDB(db);
      await sock.sendMessage(from, { text: `⚠️ ${nama} diberi warning (${group.warns[target]}/3)` });
    }
  },
  '.unwarn': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const target = resolveTarget(msg, args);
      if (!target) { await sock.sendMessage(from, { text: 'Tag atau taip nombor member.' }); return; }
      const db = loadDB();
      const group = getGroup(db, from);
      group.warns[target] = Math.max((group.warns[target] || 0) - 1, 0);
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Warning dikurangkan (${group.warns[target]}/3)` });
    }
  },
  '.setgcname': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const nama = args.join(' ');
      if (!nama) { await sock.sendMessage(from, { text: 'Format:.setgcname Nama Baru' }); return; }
      await sock.groupUpdateSubject(from, nama);
    }
  },
  '.setppgc': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const quoted = getQuotedInfo(msg);
      if (!quoted ||!quoted.message.imageMessage) {
        await sock.sendMessage(from, { text: 'Reply kepada gambar untuk tukar foto group.' });
        return;
      }
      const fakeMsg = { key: { remoteJid: from, id: quoted.stanzaId, participant: quoted.participant }, message: quoted.message };
      try {
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {});
        await sock.updateProfilePicture(from, buffer);
        await sock.sendMessage(from, { text: '✅ Foto group dikemaskini.' });
      } catch (err) {
        console.error('Ralat setppgc:', err);
        await sock.sendMessage(from, { text: '❌ Gagal tukar foto group.' });
      }
    }
  },
  '.delete': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const quoted = getQuotedInfo(msg);
      if (!quoted) { await sock.sendMessage(from, { text: 'Reply kepada mesej yang nak dipadam.' }); return; }
      await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } });
    }
  },
  '.linkgc': {
    level: 'admin',
    handler: async (sock, from) => {
      const code = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `🔗 https://chat.whatsapp.com/${code}` });
    }
  },
  '.tagall': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map(p => p.id);
      const pesanTambahan = args.join(' ');
      let text = `📢 *Tag All*${pesanTambahan? `\n${pesanTambahan}` : ''}\n\n`;
      participants.forEach(id => { text += `@${id.split('@')[0]}\n`; });
      await sock.sendMessage(from, { text, mentions: participants });
    }
  },
  '.hidetag': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map(p => p.id);
      const pesan = args.join(' ') || 'Perhatian semua!';
      await sock.sendMessage(from, { text: pesan, mentions: participants });
    }
  },
  '.totag': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const quoted = getQuotedInfo(msg);
      if (!quoted) { await sock.sendMessage(from, { text: 'Reply kepada mesej yang nak disebarkan.' }); return; }
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map(p => p.id);
      const teksAsal = quoted.message.conversation || quoted.message.extendedTextMessage?.text || '[media]';
      await sock.sendMessage(from, { text: teksAsal, mentions: participants });
    }
  },
  '.listonline': {
    level: 'admin',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: 'ℹ️ WhatsApp tidak sediakan cara rasmi untuk semak status online semua ahli (sekatan privasi).' });
    }
  },
  '.setdesc': {
    level: 'admin',
    handler: async (sock, from, sender, msg, args) => {
      const desc = args.join(' ');
      if (!desc) { await sock.sendMessage(from, { text: 'Format:.setdesc Penerangan baru' }); return; }
      await sock.groupUpdateDescription(from, desc);
    }
  },
  '.closegc': {
    level: 'admin',
    handler: async (sock, from) => {
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: '🔒 Group ditutup — hanya admin boleh hantar mesej.' });
    }
  },
  '.opengc': {
    level: 'admin',
    handler: async (sock, from) => {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: '🔓 Group dibuka — semua ahli boleh hantar mesej.' });
    }
  },
  '.pin': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const quoted = getQuotedInfo(msg);
      if (!quoted) { await sock.sendMessage(from, { text: 'Reply kepada mesej yang nak dipin.' }); return; }
      try {
        await sock.sendMessage(from, { pin: { type: 1, time: 86400, key: { remoteJid: from, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } } });
        await sock.sendMessage(from, { text: '📌 Mesej dipin (24 jam).' });
      } catch (err) {
        await sock.sendMessage(from, { text: '❌ Gagal pin.' });
      }
    }
  },
  '.unpin': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const quoted = getQuotedInfo(msg);
      if (!quoted) { await sock.sendMessage(from, { text: 'Reply kepada mesej yang nak diunpin.' }); return; }
      try {
        await sock.sendMessage(from, { pin: { type: 0, key: { remoteJid: from, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } } });
        await sock.sendMessage(from, { text: '📌 Mesej diunpin.' });
      } catch (err) {
        await sock.sendMessage(from, { text: '❌ Gagal unpin.' });
      }
    }
  },
  '.viewprofile': { level:'admin', handler: async(sock,from,sender,msg,args)=>{ const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!target){ await sock.sendMessage(from,{text:'Tag orang'}); return; } const db=loadDB(); const u=db.users[target]; if(!u){ await sock.sendMessage(from,{text:'User tak jumpa'}); return; } await sock.sendMessage(from,{text:`Profile @${target.split('@')[0]}\nGender:${u.gender}\nUmur:${u.umur}\nBio:${u.bio}\nCoin:${u.coin}\nLevel:${u.level}`, mentions:[target]}); } },
  '.delprofile': { level:'admin', handler: async(sock,from,sender,msg,args)=>{ const target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; const db=loadDB(); if(db.users[target]){ db.users[target].gender=''; db.users[target].umur=''; db.users[target].bio=''; saveDB(db); await sock.sendMessage(from,{text:'✅ Profile dibersihkan'}); } } },
  // ===== FIX: SETWELCOME & SETLEAVE - ADMIN SAHAJA =====
    '.setwelcome': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const raw = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const text = raw.replace(/^\.setwelcome\s*/i, '').trim();
      if (!text) return sock.sendMessage(from, { text: 'Guna:\n.setwelcome Selamat datang @user\n\nIntro:\nnama: \numur:' });
      const db = loadDB();
      if (!db.groups) db.groups = {};
      if (!db.groups[from]) db.groups[from] = {};
      db.groups[from].welcome = text;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Welcome diset:\n\n${text}` });
    }
  },
  '.setleave': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const raw = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const text = raw.replace(/^\.setleave\s*/i, '').trim();
      if (!text) return sock.sendMessage(from, { text: 'Guna:\n.setleave Selamat tinggal @user' });
      const db = loadDB();
      if (!db.groups) db.groups = {};
      if (!db.groups[from]) db.groups[from] = {};
      db.groups[from].leave = text;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Leave diset:\n\n${text}` });
    }
  },
  '.setleft': {
    level: 'admin',
    handler: async (sock, from, sender, msg) => {
      const raw = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const text = raw.replace(/^\.setleft\s*/i, '').trim();
      if (!text) return sock.sendMessage(from, { text: 'Guna:\n.setleft Selamat tinggal @user' });
      const db = loadDB();
      if (!db.groups) db.groups = {};
      if (!db.groups[from]) db.groups[from] = {};
      db.groups[from].leave = text;
      saveDB(db);
      await sock.sendMessage(from, { text: `✅ Leave diset:\n\n${text}` });
    }
  },
};