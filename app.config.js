const ENV = require('./env');

module.exports = {
  expo: {
    name: "PrdctScnr",
    // ... other expo config
    extra: {
      openaiApiKey: ENV.openaiApiKey,
    },
  },
};
