function logWithLevel(level, message, context = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

function logInfo(message, context) {
  logWithLevel('info', message, context);
}

function logWarn(message, context) {
  logWithLevel('warn', message, context);
}

function logError(message, context) {
  logWithLevel('error', message, context);
}

module.exports = {
  logInfo,
  logWarn,
  logError,
};
