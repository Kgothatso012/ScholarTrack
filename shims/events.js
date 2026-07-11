// Minimal EventEmitter polyfill for Hermes (RN).
// ws (transitive of @supabase/realtime-js) does `require('events')` at top level
// and accesses `.EventEmitter`. Hermes has no Node `events` module.
// ponytail: minimal compat shim, ~40 lines. Upgrade to `eventemitter3` npm pkg
// if you need more API surface (removeListener, listenerCount, etc.).

class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, listener) {
    if (!this._events.has(event)) this._events.set(event, []);
    this._events.get(event).push(listener);
    return this;
  }

  once(event, listener) {
    const wrap = (...args) => {
      this.off(event, wrap);
      listener(...args);
    };
    return this.on(event, wrap);
  }

  off(event, listener) {
    const list = this._events.get(event);
    if (!list) return this;
    const i = list.indexOf(listener);
    if (i !== -1) list.splice(i, 1);
    if (list.length === 0) this._events.delete(event);
    return this;
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }

  emit(event, ...args) {
    const list = this._events.get(event);
    if (!list) return false;
    // copy so off() during emit doesn't skip listeners
    for (const fn of list.slice()) fn(...args);
    return true;
  }

  removeAllListeners(event) {
    if (event === undefined) this._events.clear();
    else this._events.delete(event);
    return this;
  }

  listenerCount(event) {
    const list = this._events.get(event);
    return list ? list.length : 0;
  }

  setMaxListeners() {
    /* no-op */
  }
}

module.exports = { EventEmitter };
module.exports.EventEmitter = EventEmitter;
module.exports.default = EventEmitter;