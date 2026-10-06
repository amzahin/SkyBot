const activeVotes = {};

function getVoteSession(groupId) {
  return activeVotes[groupId];
}

function startVoteSession(groupId, timeoutMs, onExpire) {
  if (activeVotes[groupId]) clearTimeout(activeVotes[groupId].timer);
  const timer = setTimeout(() => {
    delete activeVotes[groupId];
    if (onExpire) onExpire();
  }, timeoutMs);
  activeVotes[groupId] = {
    targets: {},
    voters: {},
    timer
  };
  return activeVotes[groupId];
}

function addVote(groupId, targetId, voterId) {
  const session = activeVotes[groupId];
  if (!session) return null;

  // 1 orang 1 vote
  if (session.voters[voterId]) {
    const old = session.voters[voterId];
    if (session.targets[old]) session.targets[old].delete(voterId);
  }

  if (!session.targets[targetId]) session.targets[targetId] = new Set();
  session.targets[targetId].add(voterId);
  session.voters[voterId] = targetId;

  return session.targets;
}

function stopVoteSession(groupId) {
  const session = activeVotes[groupId];
  if (session) {
    clearTimeout(session.timer);
    delete activeVotes[groupId];
    return true;
  }
  return false;
}

module.exports = { getVoteSession, startVoteSession, addVote, stopVoteSession };