const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: {},
      shop: {
        limit1: { name: 'Tambah 10 Limit Tools', price: 500, addLimit: 10 },
        limit2: { name: 'Upgrade ke Level 2', price: 1000, level: 2 }
      },
      afk: {},
      botPrice: 0,
      botName: 'Bot',
      badwords: [],
      blacklist: [],
      owners: [],
      globalBotActive: true,
      groups: {}
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.badwords) db.badwords = [];
  if (!db.blacklist) db.blacklist = [];
  if (!db.owners) db.owners = [];
  if (!db.groups) db.groups = {};
  if (db.globalBotActive === undefined) db.globalBotActive = true;
  if (!db.botName) db.botName = 'Bot';
  return db;
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(db, userId, pushName) {
  if (!db.users[userId]) {
    db.users[userId] = {
      name: pushName || 'User',
      coin: 150,
      level: 1,
      limit: 0,
      aura: 0,
      lastClaim: 0,
      gender: '',
      umur: '',
      bio: '',
    };
  } else if (pushName) {
    db.users[userId].name = pushName;
  }
  return db.users[userId];
}

function getGroup(db, groupId) {
  if (!db.groups[groupId]) {
    db.groups[groupId] = { paused: false, activeHours: null, warns: {} };
  }
  if (!db.groups[groupId].warns) db.groups[groupId].warns = {};
  return db.groups[groupId];
}

module.exports = { loadDB, saveDB, getUser, getGroup };