const { loadData } = require('../panel');

module.exports = {
  '.truth': {
    level: 'all',
    handler: async (sock, from) => {
      const all = loadData('truthdare').filter(v => v.type === 'truth');
      if (!all.length) {
        await sock.sendMessage(from, { text: 'Belum ada soalan Truth. Tambah di panel /truthdare' });
        return;
      }
      const q = all[Math.floor(Math.random() * all.length)];
      await sock.sendMessage(from, { text: `🗣️ *TRUTH*\n\n${q.text}` });
    }
  },
  '.dare': {
    level: 'all',
    handler: async (sock, from) => {
      const all = loadData('truthdare').filter(v => v.type === 'dare');
      if (!all.length) {
        await sock.sendMessage(from, { text: 'Belum ada Dare. Tambah di panel /truthdare' });
        return;
      }
      const q = all[Math.floor(Math.random() * all.length)];
      await sock.sendMessage(from, { text: `🔥 *DARE*\n\n${q.text}` });
    }
  },
};