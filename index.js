const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const { loadDB, saveDB, getUser, getGroup } = require('./database');
const { startPanel } = require('./panel');
const { isWithinStoppedHours } = require('./utils');
const { getGame, endGame } = require('./games');
const { getSession: getWtsSession, onClueReceived, onVoteReceived } = require('./wts');
const { getVoteSession, startVoteSession, addVote, stopVoteSession } = require('./votes');
const { getPending, clearPending } = require('./pendingConfirm');
const { resolveTarget } = require('./utils');

const memberCommands = require('./commands/member');
const adminCommands = require('./commands/admin');
const ownerCommands = require('./commands/owner');
const gameCommands = require('./commands/game');
const quotesCommands = require('./commands/quotes');
const funCommands = require('./commands/fun');
const truthdareCommands = require('./commands/truthdare');

const OWNER_NUMBERS = [
  '60123456789@s.whatsapp.net',
  '189443155689569@lid'
];

function isOwner(senderId, db) {
  if (!senderId) return false;
  const cleanSender = senderId.split('@')[0];
  const check = (list) => list && list.some(o => {
    const cleanO = o.split('@')[0];
    return senderId === o || cleanSender === cleanO;
  });
  if (check(OWNER_NUMBERS)) return true;
  if (check(db.owners)) return true;
  return false;
}

const commands = {
...memberCommands,
...adminCommands,
...ownerCommands,
...gameCommands,
...quotesCommands,
...funCommands,
...truthdareCommands,
  '.vote': {
  level: 'all',
  handler: async (sock, from, sender, msg, args) => {
    const target = resolveTarget(msg, args);
    if (!target) {
      await sock.sendMessage(from, { text: 'Tag orang yang nak divote. Contoh:.vote @ahmad' });
      return;
    }
    if (!getVoteSession(from)) {
      startVoteSession(from, 10 * 60 * 1000, async () => {
        await sock.sendMessage(from, { text: '⏰ Sesi vote tamat (10 minit).' });
      });
    }
    const allVotes = addVote(from, target, sender);
    let text = `📊 *LIST VOTE AKTIF*\n\n`;
    let mentions = [];
    let no = 1;
    for (const [targetId, voterSet] of Object.entries(allVotes)) {
      if (voterSet.size > 0) {
        text += `${no}. @${targetId.split('@')[0]} - ${voterSet.size} vote\n`;
        mentions.push(targetId);
        no++;
      }
    }
    text += `\nKetik.vote @orang untuk vote\n.votestop untuk hentikan`;
    await sock.sendMessage(from, { text, mentions });
  }
},
'.votestop': {
  level: 'all',
  handler: async (sock, from) => {
    const berjaya = stopVoteSession(from);
    await sock.sendMessage(from, { text: berjaya? '🛑 Vote dihentikan.' : 'ℹ️ Tiada vote aktif.' });
  }
},
  '.menu': {
    level: 'all',
    handler: async (sock, from, sender, msg) => {
      const db = loadDB();
      const user = getUser(db, sender, msg.pushName);
      const kategori = {
        'TOOLS': ['.profile', '.claim', '.buy', '.buylevel', '.listbrg', '.leaderboard', '.afk', '.hargabot', '.totalfitur', '.menu', '.info', '.vote', '.votestop'],
        'GAME': ['.tekateki', '.tekagambar', '.math', '.tekanombor', '.tekabendera', '.tekalirik', '.curi', '.wts', '.quizsej', '.quizstem'],
        'QUOTES': ['.quotes', '.bijak', '.truth', '.dare', '.nasihat'],
        'FUN': ['.rate', '.jodoh', '.ceksifat', '.aura'],
        'BOT': ['.pausebot', '.continuebot', '.removebot'],
        'GROUP': ['.kick', '.warn', '.unwarn', '.setgcname', '.setppgc', '.delete', '.linkgc', '.resetlink', '.tagall', '.pin', '.unpin', '.hidetag', '.totag', '.setdesc', '.closegc', '.opengc', '.setwelcome', '.setleft', '.accepta', '.rejectall'],
        'OWNER': ['.stopbot', '.startbot', '.botset', '.addduit', '.addlvl', '.setbotname', '.setbotstop', '.addbadword', '.delbadword', '.addowner', '.blacklist', '.whitelist', '.resetuser', '.reseta', '.resetcoin', '.resetlevel', '.resetlimit'],
      };
      let text = `Nama : ${db.botName}\nNama : ${user.name}\nLvl : ${user.level}\nDuit : ${user.coin}\n\n`;
      for (const [nama, list] of Object.entries(kategori)) {
        text += `┅「${nama}」\n`;
        list.forEach(cmd => { text += `┇➥${cmd}\n`; });
      }
      await sock.sendMessage(from, { text: text.trim() });
    }
  },
  '.totalfitur': {
    level: 'all',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: `📊 Jumlah fitur sekarang: ${Object.keys(commands).length}` });
    }
  },
};

async function isGroupAdmin(sock, groupId, senderId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const p = groupMetadata.participants.find(x => x.id === senderId || x.id.split('@')[0] === senderId.split('@')[0]);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch { return false; }
}

async function hasPermission(sock, groupId, senderId, level, db) {
  if (level === 'all') return true;
  if (isOwner(senderId, db)) return true;
  if (level === 'owner') return false;
  if (level === 'admin') return await isGroupAdmin(sock, groupId, senderId);
  return false;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Sambungan terputus, sambung semula:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Berjaya sambung ke WhatsApp');
    }
  });

  // ===== WELCOME & LEAVE - FIX RATE-LIMIT =====
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;
      const db = loadDB();
      const groupData = db.groups?.[id];
      if (!groupData) return;

      const userIds = participants.map(p => typeof p === 'string'? p : p.id).filter(Boolean);
      if (userIds.length === 0) return;

      let groupName = id;
      try {
        const meta = await sock.groupMetadata(id);
        groupName = meta.subject;
      } catch {}

      if (action === 'add' && groupData.welcome) {
        for (const uid of userIds) {
          const text = groupData.welcome.replace(/@user/g, `@${uid.split('@')[0]}`).replace(/@group/g, groupName).replace(/@desc/g, '');
          await sock.sendMessage(id, { text, mentions: [uid] });
          await new Promise(r => setTimeout(r, 1200));
        }
      }
      if (action === 'remove' && groupData.leave) {
        for (const uid of userIds) {
          const text = groupData.leave.replace(/@user/g, `@${uid.split('@')[0]}`).replace(/@group/g, groupName);
          await sock.sendMessage(id, { text, mentions: [uid] });
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    } catch (e) {
      console.log('Welcome skip:', e.message);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      const from = msg.key.remoteJid;
      if (!from.endsWith('@g.us')) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const sender = msg.key.participant || msg.key.remoteJid;
      const senderLid = msg.key?.senderLid || '';
      const realSender = senderLid || sender;
      console.log(`📩 [Group: ${from}] ${realSender}: ${text}`);
      const db = loadDB();
      const [cmdName,...args] = text.trim().split(/\s+/);
      const cmd = commands[cmdName?.toLowerCase()];
      if (!cmd) return;
      const senderIsOwner = isOwner(realSender, db) || isOwner(sender, db);
      if (db.blacklist.includes(sender) &&!senderIsOwner) return;
      const allowed = await hasPermission(sock, from, realSender, cmd.level, db);
      if (!allowed) {
        await sock.sendMessage(from, { text: '❌ Anda tiada kebenaran untuk guna command ni.' });
        return;
      }
      await cmd.handler(sock, from, realSender, msg, args);
    } catch (err) {
      console.error('🔥 RALAT:', err);
    }
  });

  return sock;
}

startPanel(3000);
startBot();