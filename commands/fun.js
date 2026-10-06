function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  '.rate': {
    level: 'all',
    handler: async (sock, from) => {
      await sock.sendMessage(from, { text: `⭐ Rating: ${randomInt(1, 10)}/10` });
    }
  },
  '.jodoh': {
    level: 'all',
    handler: async (sock, from, sender) => {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map(p => p.id).filter(id => id !== sender);
      if (participants.length === 0) { await sock.sendMessage(from, { text: '❌ Tiada ahli lain.' }); return; }
      const pasangan = participants[Math.floor(Math.random() * participants.length)];
      await sock.sendMessage(from, {
        text: `💘 Jodoh @${sender.split('@')[0]} dengan @${pasangan.split('@')[0]} — ${randomInt(0, 100)}% serasi!`,
        mentions: [sender, pasangan]
      });
    }
  },
  '.ceksifat': {
    level: 'all',
    handler: async (sock, from) => {
      const senarai = ['Peramah', 'Pemalu', 'Kelakar', 'Serius', 'Baik hati', 'Degil', 'Rajin', 'Pemalas', 'Romantik', 'Misteri'];
      await sock.sendMessage(from, { text: `🔮 Sifat anda hari ini: *${senarai[Math.floor(Math.random() * senarai.length)]}*` });
    }
  },
  '.aura': {
    level: 'all',
    handler: async (sock, from) => {
      const nilai = randomInt(-9999, 9999);
      await sock.sendMessage(from, { text: `✨ Aura: ${nilai >= 0 ? '+' : ''}${nilai}` });
    }
  },
};