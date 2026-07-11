// Metro config — alias Node `events` to a Hermes-compatible shim.
// Without this, `ws` (transitive of @supabase/realtime-js) crashes at bundle
// eval time with "Cannot read property 'EventEmitter' of undefined".

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: path.resolve(__dirname, 'shims/events.js'),
};

module.exports = config;