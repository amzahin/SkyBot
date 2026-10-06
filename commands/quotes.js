const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'quotes.json');

function loadQuotes(){
  try{
    if(!fs.existsSync(filePath)){
      fs.writeFileSync(filePath, JSON.stringify({quotes:[], bijak:[], nasihat:[]}, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if(Array.isArray(data)) return { quotes: data, bijak: [], nasihat: [] };
    return {
      quotes: data.quotes || [],
      bijak: data.bijak || [],
      nasihat: data.nasihat || []
    };
  }catch{
    return { quotes: [], bijak: [], nasihat: [] };
  }
}
function pick(arr){
  if(!arr ||!arr.length) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}

function makeHandler(type, title){
  return {
    level: 'all',
    handler: async (sock, from, sender, msg, args) => {
      const data = loadQuotes();
      const list = data[type] || [];
      let text = pick(list);
      if(!text){
        text = `Belum ada data ${title}. Tambah di Panel http://localhost:3000/quotes`;
      }
      await sock.sendMessage(from, { text: `${title}\n\n"${text}"` }, { quoted: msg });
    }
  };
}

module.exports = {
  '.quotes': makeHandler('quotes','💬 QUOTES'),
  '.qoutes': makeHandler('quotes','💬 QUOTES'), // typo support
  '.quote': makeHandler('quotes','💬 QUOTES'),
  '.bijak': makeHandler('bijak','🧠 KATA BIJAK'),
  '.nasihat': makeHandler('nasihat','🤲 NASIHAT'),
};