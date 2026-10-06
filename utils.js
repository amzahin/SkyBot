function resolveTarget(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned && mentioned.length > 0) return mentioned[0];

  if (args && args[0]) {
    const num = args[0].replace(/[^0-9]/g, '');
    if (num) return num + '@s.whatsapp.net';
  }
  return null;
}

function getQuotedInfo(msg) {
  const context = msg.message?.extendedTextMessage?.contextInfo;
  if (!context || !context.quotedMessage) return null;
  return {
    message: context.quotedMessage,
    participant: context.participant,
    stanzaId: context.stanzaId
  };
}

function isWithinStoppedHours(activeHours) {
  if (!activeHours) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const [stopH, stopM] = activeHours.stop.split(':').map(Number);
  const [startH, startM] = activeHours.start.split(':').map(Number);
  const stopMin = stopH * 60 + stopM;
  const startMin = startH * 60 + startM;

  if (stopMin < startMin) {
    return current >= stopMin || current < startMin;
  }
  return current >= stopMin && current < startMin;
}

module.exports = { resolveTarget, getQuotedInfo, isWithinStoppedHours };