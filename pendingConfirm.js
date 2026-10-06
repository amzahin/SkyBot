const pending = {};

function setPending(groupId, data) { pending[groupId] = data; }
function getPending(groupId) { return pending[groupId]; }
function clearPending(groupId) { delete pending[groupId]; }

module.exports = { setPending, getPending, clearPending };