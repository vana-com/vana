/* eslint-disable */

(function UMDish(name, context, definition, plugins) {
  context[name] = definition.call(context);
  for (let i = 0; i < plugins.length; i++) {
    plugins[i](context[name]);
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = context[name];
  } else if (typeof define === 'function' && define.amd) {
    define(function reference() { return context[name]; });
  }
}('Primus', this || {}, function wrapper() {
  let define; let module; let exports;
  const Primus = (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { const c = typeof require === 'function' && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); const a = new Error(`Cannot find module '${i}'`); throw a.code = 'MODULE_NOT_FOUND', a; } const p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { const n = e[i][1][r]; return o(n || r); }, p, p.exports, r, e, n, t); } return n[i].exports; } for (var u = typeof require === 'function' && require, i = 0; i < t.length; i++)o(t[i]); return o; } return r; }())({ 1: [function (_dereq_, module, exports) {
    /**
 * Create a function that will cleanup the instance.
 *
 * @param {Array|String} keys Properties on the instance that needs to be cleared.
 * @param {Object} options Additional configuration.
 * @returns {Function} Destroy function
 * @api public
 */
    module.exports = function demolish(keys, options) {
      const split = /[, ]+/;

      options = options || {};
      keys = keys || [];

      if (typeof keys === 'string') keys = keys.split(split);

      /**
   * Run addition cleanup hooks.
   *
   * @param {String} key Name of the clean up hook to run.
   * @param {Mixed} selfie Reference to the instance we're cleaning up.
   * @api private
   */
      function run(key, selfie) {
        if (!options[key]) return;
        if (typeof options[key] === 'string') options[key] = options[key].split(split);
        if (typeof options[key] === 'function') return options[key].call(selfie);

        for (var i = 0, type, what; i < options[key].length; i++) {
          what = options[key][i];
          type = typeof what;

          if (type === 'function') {
            what.call(selfie);
          } else if (type === 'string' && typeof selfie[what] === 'function') {
            selfie[what]();
          }
        }
      }

      /**
   * Destroy the instance completely and clean up all the existing references.
   *
   * @returns {Boolean}
   * @api public
   */
      return function destroy() {
        const selfie = this;
        let i = 0;
        let prop;

        if (selfie[keys[0]] === null) return false;
        run('before', selfie);

        for (; i < keys.length; i++) {
          prop = keys[i];

          if (selfie[prop]) {
            if (typeof selfie[prop].destroy === 'function') selfie[prop].destroy();
            selfie[prop] = null;
          }
        }

        if (selfie.emit) selfie.emit('destroy');
        run('after', selfie);

        return true;
      };
    };
  }, {}],
  2: [function (_dereq_, module, exports) {
    /**
 * Returns a function that when invoked executes all the listeners of the
 * given event with the given arguments.
 *
 * @returns {Function} The function that emits all the things.
 * @api public
 */
    module.exports = function emits() {
      const self = this;
      let parser;

      for (var i = 0, l = arguments.length, args = new Array(l); i < l; i++) {
        args[i] = arguments[i];
      }

      //
      // If the last argument is a function, assume that it's a parser.
      //
      if (typeof args[args.length - 1] !== 'function') {
        return function emitter() {
          for (var i = 0, l = arguments.length, arg = new Array(l); i < l; i++) {
            arg[i] = arguments[i];
          }

          return self.emit.apply(self, args.concat(arg));
        };
      }

      parser = args.pop();

      /**
   * The actual function that emits the given event. It returns a boolean
   * indicating if the event was emitted.
   *
   * @returns {Boolean}
   * @api public
   */
      return function emitter() {
        for (var i = 0, l = arguments.length, arg = new Array(l + 1); i < l; i++) {
          arg[i + 1] = arguments[i];
        }

        /**
     * Async completion method for the parser.
     *
     * @param {Error} err Optional error when parsing failed.
     * @param {Mixed} returned Emit instructions.
     * @api private
     */
        arg[0] = function next(err, returned) {
          if (err) return self.emit('error', err);

          arg = returned === undefined
            ? arg.slice(1) : returned === null
              ? [] : returned;

          self.emit.apply(self, args.concat(arg));
        };

        parser.apply(self, arg);
        return true;
      };
    };
  }, {}],
  3: [function (_dereq_, module, exports) {
    const has = Object.prototype.hasOwnProperty;
    let prefix = '~';

    /**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }

      const listener = new EE(fn, context || emitter, once);
      const evt = prefix ? prefix + event : event;

      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];

      return emitter;
    }

    /**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }

    /**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
    EventEmitter.prototype.eventNames = function eventNames() {
      const names = [];
      let events;
      let name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
    EventEmitter.prototype.listeners = function listeners(event) {
      const evt = prefix ? prefix + event : event;
      const handlers = this._events[evt];

      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];

      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }

      return ee;
    };

    /**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      const evt = prefix ? prefix + event : event;
      const listeners = this._events[evt];

      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };

    /**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      const evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      const listeners = this._events[evt];
      const len = arguments.length;
      let args;
      let i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        const { length } = listeners;
        let j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
          default:
            if (!args) {
              for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
            }

            listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };

    /**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };

    /**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      const evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }

      const listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], { length } = listeners; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }

      return this;
    };

    /**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      let evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    if (typeof module !== 'undefined') {
      module.exports = EventEmitter;
    }
  }, {}],
  4: [function (_dereq_, module, exports) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true,
            },
          });
        }
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          const TempCtor = function () {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }, {}],
  5: [function (_dereq_, module, exports) {
    const regex = new RegExp(`^((?:\\d+)?\\.?\\d+) *(${[
      'milliseconds?',
      'msecs?',
      'ms',
      'seconds?',
      'secs?',
      's',
      'minutes?',
      'mins?',
      'm',
      'hours?',
      'hrs?',
      'h',
      'days?',
      'd',
      'weeks?',
      'wks?',
      'w',
      'years?',
      'yrs?',
      'y',
    ].join('|')})?$`, 'i');

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const year = day * 365;

    /**
 * Parse a time string and return the number value of it.
 *
 * @param {String} ms Time string.
 * @returns {Number}
 * @api private
 */
    module.exports = function millisecond(ms) {
      const type = typeof ms;
      let amount;
      let match;

      if (type === 'number') return ms;
      if (type !== 'string' || ms === '0' || !ms) return 0;
      if (+ms) return +ms;

      //
      // We are vulnerable to the regular expression denial of service (ReDoS).
      // In order to mitigate this we don't parse the input string if it is too long.
      // See https://nodesecurity.io/advisories/46.
      //
      if (ms.length > 10000 || !(match = regex.exec(ms))) return 0;

      amount = parseFloat(match[1]);

      switch (match[2].toLowerCase()) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return amount * year;

      case 'weeks':
      case 'week':
      case 'wks':
      case 'wk':
      case 'w':
        return amount * week;

      case 'days':
      case 'day':
      case 'd':
        return amount * day;

      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return amount * hour;

      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return amount * minute;

      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return amount * second;

      default:
        return amount;
      }
    };
  }, {}],
  6: [function (_dereq_, module, exports) {
    /**
 * Wrap callbacks to prevent double execution.
 *
 * @param {Function} fn Function that should only be called once.
 * @returns {Function} A wrapped callback which prevents execution.
 * @api public
 */
    module.exports = function one(fn) {
      let called = 0;
      let value;

      /**
   * The function that prevents double execution.
   *
   * @api private
   */
      function onetime() {
        if (called) return value;

        called = 1;
        value = fn.apply(this, arguments);
        fn = null;

        return value;
      }

      //
      // To make debugging more easy we want to use the name of the supplied
      // function. So when you look at the functions that are assigned to event
      // listeners you don't see a load of `onetime` functions but actually the
      // names of the functions that this module will call.
      //
      onetime.displayName = fn.displayName || fn.name || onetime.displayName || onetime.name;
      return onetime;
    };
  }, {}],
  7: [function (_dereq_, module, exports) {
    // shim for using process in browser
    const process = module.exports = {};

    // cached from whatever global is present so that test runners that stub it
    // don't break things.  But we need to wrap it in a try catch in case it is
    // wrapped in strict mode code which doesn't define any globals.  It's inside a
    // function because try/catches deoptimize in certain engines.

    let cachedSetTimeout;
    let cachedClearTimeout;

    function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout() {
      throw new Error('clearTimeout has not been defined');
    }
    (function () {
      try {
        if (typeof setTimeout === 'function') {
          cachedSetTimeout = setTimeout;
        } else {
          cachedSetTimeout = defaultSetTimout;
        }
      } catch (e) {
        cachedSetTimeout = defaultSetTimout;
      }
      try {
        if (typeof clearTimeout === 'function') {
          cachedClearTimeout = clearTimeout;
        } else {
          cachedClearTimeout = defaultClearTimeout;
        }
      } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
      }
    }());
    function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
        // normal enviroments in sane situations
        return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
      }
      try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
      } catch (e) {
        try {
          // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
          return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
          // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
          return cachedSetTimeout.call(this, fun, 0);
        }
      }
    }
    function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
        // normal enviroments in sane situations
        return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
      }
      try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
      } catch (e) {
        try {
          // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
          return cachedClearTimeout.call(null, marker);
        } catch (e) {
          // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
          // Some versions of I.E. have different rules for clearTimeout vs setTimeout
          return cachedClearTimeout.call(this, marker);
        }
      }
    }
    let queue = [];
    let draining = false;
    let currentQueue;
    let queueIndex = -1;

    function cleanUpNextTick() {
      if (!draining || !currentQueue) {
        return;
      }
      draining = false;
      if (currentQueue.length) {
        queue = currentQueue.concat(queue);
      } else {
        queueIndex = -1;
      }
      if (queue.length) {
        drainQueue();
      }
    }

    function drainQueue() {
      if (draining) {
        return;
      }
      const timeout = runTimeout(cleanUpNextTick);
      draining = true;

      let len = queue.length;
      while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
          if (currentQueue) {
            currentQueue[queueIndex].run();
          }
        }
        queueIndex = -1;
        len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
    }

    process.nextTick = function (fun) {
      const args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
        for (let i = 1; i < arguments.length; i++) {
          args[i - 1] = arguments[i];
        }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
      }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
      this.fun = fun;
      this.array = array;
    }
    Item.prototype.run = function () {
      this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};

    function noop() {}

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;

    process.listeners = function (name) { return []; };

    process.binding = function (name) {
      throw new Error('process.binding is not supported');
    };

    process.cwd = function () { return '/'; };
    process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
    };
    process.umask = function () { return 0; };
  }, {}],
  8: [function (_dereq_, module, exports) {
    const has = Object.prototype.hasOwnProperty;
    let undef;

    /**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String|Null} The decoded string.
 * @api private
 */
    function decode(input) {
      try {
        return decodeURIComponent(input.replace(/\+/g, ' '));
      } catch (e) {
        return null;
      }
    }

    /**
 * Attempts to encode a given input.
 *
 * @param {String} input The string that needs to be encoded.
 * @returns {String|Null} The encoded string.
 * @api private
 */
    function encode(input) {
      try {
        return encodeURIComponent(input);
      } catch (e) {
        return null;
      }
    }

    /**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
    function querystring(query) {
      const parser = /([^=?&]+)=?([^&]*)/g;
      const result = {};
      let part;

      while (part = parser.exec(query)) {
        const key = decode(part[1]);
        const value = decode(part[2]);

        //
        // Prevent overriding of existing properties. This ensures that build-in
        // methods like `toString` or __proto__ are not overriden by malicious
        // querystrings.
        //
        // In the case if failed decoding, we want to omit the key/value pairs
        // from the result.
        //
        if (key === null || value === null || key in result) continue;
        result[key] = value;
      }

      return result;
    }

    /**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
    function querystringify(obj, prefix) {
      prefix = prefix || '';

      const pairs = [];
      let value;
      let key;

      //
      // Optionally prefix with a '?' if needed
      //
      if (typeof prefix !== 'string') prefix = '?';

      for (key in obj) {
        if (has.call(obj, key)) {
          value = obj[key];

          //
          // Edge cases where we actually want to encode the value to an empty
          // string instead of the stringified value.
          //
          if (!value && (value === null || value === undef || isNaN(value))) {
            value = '';
          }

          key = encodeURIComponent(key);
          value = encodeURIComponent(value);

          //
          // If we failed to encode the strings, we should bail out as we don't
          // want to add invalid strings to the query.
          //
          if (key === null || value === null) continue;
          pairs.push(`${key}=${value}`);
        }
      }

      return pairs.length ? prefix + pairs.join('&') : '';
    }

    //
    // Expose the module.
    //
    exports.stringify = querystringify;
    exports.parse = querystring;
  }, {}],
  9: [function (_dereq_, module, exports) {
    const EventEmitter = _dereq_('eventemitter3');
    const millisecond = _dereq_('millisecond');
    const destroy = _dereq_('demolish');
    const Tick = _dereq_('tick-tock');
    const one = _dereq_('one-time');

    /**
 * Returns sane defaults about a given value.
 *
 * @param {String} name Name of property we want.
 * @param {Recovery} selfie Recovery instance that got created.
 * @param {Object} opts User supplied options we want to check.
 * @returns {Number} Some default value.
 * @api private
 */
    function defaults(name, selfie, opts) {
      return millisecond(
        name in opts ? opts[name] : (name in selfie ? selfie[name] : Recovery[name]),
      );
    }

    /**
 * Attempt to recover your connection with reconnection attempt.
 *
 * @constructor
 * @param {Object} options Configuration
 * @api public
 */
    function Recovery(options) {
      const recovery = this;

      if (!(recovery instanceof Recovery)) return new Recovery(options);

      options = options || {};

      recovery.attempt = null; // Stores the current reconnect attempt.
      recovery._fn = null; // Stores the callback.

      recovery['reconnect timeout'] = defaults('reconnect timeout', recovery, options);
      recovery.retries = defaults('retries', recovery, options);
      recovery.factor = defaults('factor', recovery, options);
      recovery.max = defaults('max', recovery, options);
      recovery.min = defaults('min', recovery, options);
      recovery.timers = new Tick(recovery);
    }

    Recovery.prototype = new EventEmitter();
    Recovery.prototype.constructor = Recovery;

    Recovery['reconnect timeout'] = '30 seconds'; // Maximum time to wait for an answer.
    Recovery.max = Infinity; // Maximum delay.
    Recovery.min = '500 ms'; // Minimum delay.
    Recovery.retries = 10; // Maximum amount of retries.
    Recovery.factor = 2; // Exponential back off factor.

    /**
 * Start a new reconnect procedure.
 *
 * @returns {Recovery}
 * @api public
 */
    Recovery.prototype.reconnect = function reconnect() {
      const recovery = this;

      return recovery.backoff(function backedoff(err, opts) {
        opts.duration = (+new Date()) - opts.start;

        if (err) return recovery.emit('reconnect failed', err, opts);

        recovery.emit('reconnected', opts);
      }, recovery.attempt);
    };

    /**
 * Exponential back off algorithm for retry operations. It uses a randomized
 * retry so we don't DDOS our server when it goes down under pressure.
 *
 * @param {Function} fn Callback to be called after the timeout.
 * @param {Object} opts Options for configuring the timeout.
 * @returns {Recovery}
 * @api private
 */
    Recovery.prototype.backoff = function backoff(fn, opts) {
      const recovery = this;

      opts = opts || recovery.attempt || {};

      //
      // Bailout when we already have a back off process running. We shouldn't call
      // the callback then.
      //
      if (opts.backoff) return recovery;

      opts['reconnect timeout'] = defaults('reconnect timeout', recovery, opts);
      opts.retries = defaults('retries', recovery, opts);
      opts.factor = defaults('factor', recovery, opts);
      opts.max = defaults('max', recovery, opts);
      opts.min = defaults('min', recovery, opts);

      opts.start = +opts.start || +new Date();
      opts.duration = +opts.duration || 0;
      opts.attempt = +opts.attempt || 0;

      //
      // Bailout if we are about to make too much attempts.
      //
      if (opts.attempt === opts.retries) {
        fn.call(recovery, new Error('Unable to recover'), opts);
        return recovery;
      }

      //
      // Prevent duplicate back off attempts using the same options object and
      // increment our attempt as we're about to have another go at this thing.
      //
      opts.backoff = true;
      opts.attempt++;

      recovery.attempt = opts;

      //
      // Calculate the timeout, but make it randomly so we don't retry connections
      // at the same interval and defeat the purpose. This exponential back off is
      // based on the work of:
      //
      // http://dthain.blogspot.nl/2009/02/exponential-backoff-in-distributed.html
      //
      opts.scheduled = opts.attempt !== 1
        ? Math.min(Math.round(
          (Math.random() + 1) * opts.min * Math.pow(opts.factor, opts.attempt - 1),
        ), opts.max)
        : opts.min;

      recovery.timers.setTimeout('reconnect', function delay() {
        opts.duration = (+new Date()) - opts.start;
        opts.backoff = false;
        recovery.timers.clear('reconnect, timeout');

        //
        // Create a `one` function which can only be called once. So we can use the
        // same function for different types of invocations to create a much better
        // and usable API.
        //
        const connect = recovery._fn = one(function connect(err) {
          recovery.reset();

          if (err) return recovery.backoff(fn, opts);

          fn.call(recovery, undefined, opts);
        });

        recovery.emit('reconnect', opts, connect);
        recovery.timers.setTimeout('timeout', function timeout() {
          const err = new Error('Failed to reconnect in a timely manner');
          opts.duration = (+new Date()) - opts.start;

          recovery.emit('reconnect timeout', err, opts);
          connect(err);
        }, opts['reconnect timeout']);
      }, opts.scheduled);

      //
      // Emit a `reconnecting` event with current reconnect options. This allows
      // them to update the UI and provide their users with feedback.
      //
      recovery.emit('reconnect scheduled', opts);

      return recovery;
    };

    /**
 * Check if the reconnection process is currently reconnecting.
 *
 * @returns {Boolean}
 * @api public
 */
    Recovery.prototype.reconnecting = function reconnecting() {
      return !!this.attempt;
    };

    /**
 * Tell our reconnection procedure that we're passed.
 *
 * @param {Error} err Reconnection failed.
 * @returns {Recovery}
 * @api public
 */
    Recovery.prototype.reconnected = function reconnected(err) {
      if (this._fn) this._fn(err);
      return this;
    };

    /**
 * Reset the reconnection attempt so it can be re-used again.
 *
 * @returns {Recovery}
 * @api public
 */
    Recovery.prototype.reset = function reset() {
      this._fn = this.attempt = null;
      this.timers.clear('reconnect, timeout');

      return this;
    };

    /**
 * Clean up the instance.
 *
 * @type {Function}
 * @returns {Boolean}
 * @api public
 */
    Recovery.prototype.destroy = destroy('timers attempt _fn');

    //
    // Expose the module.
    //
    module.exports = Recovery;
  }, { demolish: 1, eventemitter3: 10, millisecond: 5, 'one-time': 6, 'tick-tock': 12 }],
  10: [function (_dereq_, module, exports) {
    //
    // We store our EE objects in a plain object whose properties are event names.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // `~` to make sure that the built-in object properties are not overridden or
    // used as an attack vector.
    // We also assume that `Object.create(null)` is available when the event name
    // is an ES6 Symbol.
    //
    const prefix = typeof Object.create !== 'function' ? '~' : false;

    /**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
    function EventEmitter() { /* Nothing to set */ }

    /**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
    EventEmitter.prototype._events = undefined;

    /**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
    EventEmitter.prototype.listeners = function listeners(event, exists) {
      const evt = prefix ? prefix + event : event;
      const available = this._events && this._events[evt];

      if (exists) return !!available;
      if (!available) return [];
      if (available.fn) return [available.fn];

      for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
        ee[i] = available[i].fn;
      }

      return ee;
    };

    /**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      const evt = prefix ? prefix + event : event;

      if (!this._events || !this._events[evt]) return false;

      const listeners = this._events[evt];
      const len = arguments.length;
      let args;
      let i;

      if (typeof listeners.fn === 'function') {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        const { length } = listeners;
        let j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          default:
            if (!args) {
              for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
            }

            listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
    EventEmitter.prototype.on = function on(event, fn, context) {
      const listener = new EE(fn, context || this);
      const evt = prefix ? prefix + event : event;

      if (!this._events) this._events = prefix ? {} : Object.create(null);
      if (!this._events[evt]) this._events[evt] = listener;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else {
        this._events[evt] = [
          this._events[evt], listener,
        ];
      }

      return this;
    };

    /**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
    EventEmitter.prototype.once = function once(event, fn, context) {
      const listener = new EE(fn, context || this, true);
      const evt = prefix ? prefix + event : event;

      if (!this._events) this._events = prefix ? {} : Object.create(null);
      if (!this._events[evt]) this._events[evt] = listener;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else {
        this._events[evt] = [
          this._events[evt], listener,
        ];
      }

      return this;
    };

    /**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      const evt = prefix ? prefix + event : event;

      if (!this._events || !this._events[evt]) return this;

      const listeners = this._events[evt];
      const events = [];

      if (fn) {
        if (listeners.fn) {
          if (
            listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
          ) {
            events.push(listeners);
          }
        } else {
          for (let i = 0, { length } = listeners; i < length; i++) {
            if (
              listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
            ) {
              events.push(listeners[i]);
            }
          }
        }
      }

      //
      // Reset the array, or remove it completely if we have no more listeners.
      //
      if (events.length) {
        this._events[evt] = events.length === 1 ? events[0] : events;
      } else {
        delete this._events[evt];
      }

      return this;
    };

    /**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      if (!this._events) return this;

      if (event) delete this._events[prefix ? prefix + event : event];
      else this._events = prefix ? {} : Object.create(null);

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // This function doesn't apply anymore.
    //
    EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
      return this;
    };

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Expose the module.
    //
    if (typeof module !== 'undefined') {
      module.exports = EventEmitter;
    }
  }, {}],
  11: [function (_dereq_, module, exports) {
    /**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
    module.exports = function required(port, protocol) {
      protocol = protocol.split(':')[0];
      port = +port;

      if (!port) return false;

      switch (protocol) {
      case 'http':
      case 'ws':
        return port !== 80;

      case 'https':
      case 'wss':
        return port !== 443;

      case 'ftp':
        return port !== 21;

      case 'gopher':
        return port !== 70;

      case 'file':
        return false;
      }

      return port !== 0;
    };
  }, {}],
  12: [function (_dereq_, module, exports) {
    (function (setImmediate, clearImmediate) {
      const has = Object.prototype.hasOwnProperty;
      const ms = _dereq_('millisecond');

      /**
 * Timer instance.
 *
 * @constructor
 * @param {Object} timer New timer instance.
 * @param {Function} clear Clears the timer instance.
 * @param {Function} duration Duration of the timer.
 * @param {Function} fn The functions that need to be executed.
 * @api private
 */
      function Timer(timer, clear, duration, fn) {
        this.start = +(new Date());
        this.duration = duration;
        this.clear = clear;
        this.timer = timer;
        this.fns = [fn];
      }

      /**
 * Calculate the time left for a given timer.
 *
 * @returns {Number} Time in milliseconds.
 * @api public
 */
      Timer.prototype.remaining = function remaining() {
        return this.duration - this.taken();
      };

      /**
 * Calculate the amount of time it has taken since we've set the timer.
 *
 * @returns {Number}
 * @api public
 */
      Timer.prototype.taken = function taken() {
        return +(new Date()) - this.start;
      };

      /**
 * Custom wrappers for the various of clear{whatever} functions. We cannot
 * invoke them directly as this will cause thrown errors in Google Chrome with
 * an Illegal Invocation Error
 *
 * @see #2
 * @type {Function}
 * @api private
 */
      function unsetTimeout(id) { clearTimeout(id); }
      function unsetInterval(id) { clearInterval(id); }
      function unsetImmediate(id) { clearImmediate(id); }

      /**
 * Simple timer management.
 *
 * @constructor
 * @param {Mixed} context Context of the callbacks that we execute.
 * @api public
 */
      function Tick(context) {
        if (!(this instanceof Tick)) return new Tick(context);

        this.timers = {};
        this.context = context || this;
      }

      /**
 * Return a function which will just iterate over all assigned callbacks and
 * optionally clear the timers from memory if needed.
 *
 * @param {String} name Name of the timer we need to execute.
 * @param {Boolean} clear Also clear from memory.
 * @returns {Function}
 * @api private
 */
      Tick.prototype.tock = function ticktock(name, clear) {
        const tock = this;

        return function tickedtock() {
          if (!(name in tock.timers)) return;

          const timer = tock.timers[name];
          const fns = timer.fns.slice();
          const l = fns.length;
          let i = 0;

          if (clear) tock.clear(name);
          else tock.start = +new Date();

          for (; i < l; i++) {
            fns[i].call(tock.context);
          }
        };
      };

      /**
 * Add a new timeout.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Duration of the timer.
 * @returns {Tick}
 * @api public
 */
      Tick.prototype.setTimeout = function timeout(name, fn, time) {
        const tick = this;
        let tock;

        if (tick.timers[name]) {
          tick.timers[name].fns.push(fn);
          return tick;
        }

        tock = ms(time);
        tick.timers[name] = new Timer(
          setTimeout(tick.tock(name, true), ms(time)),
          unsetTimeout,
          tock,
          fn,
        );

        return tick;
      };

      /**
 * Add a new interval.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Interval of the timer.
 * @returns {Tick}
 * @api public
 */
      Tick.prototype.setInterval = function interval(name, fn, time) {
        const tick = this;
        let tock;

        if (tick.timers[name]) {
          tick.timers[name].fns.push(fn);
          return tick;
        }

        tock = ms(time);
        tick.timers[name] = new Timer(
          setInterval(tick.tock(name), ms(time)),
          unsetInterval,
          tock,
          fn,
        );

        return tick;
      };

      /**
 * Add a new setImmediate.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @returns {Tick}
 * @api public
 */
      Tick.prototype.setImmediate = function immediate(name, fn) {
        const tick = this;

        if (typeof setImmediate !== 'function') return tick.setTimeout(name, fn, 0);

        if (tick.timers[name]) {
          tick.timers[name].fns.push(fn);
          return tick;
        }

        tick.timers[name] = new Timer(
          setImmediate(tick.tock(name, true)),
          unsetImmediate,
          0,
          fn,
        );

        return tick;
      };

      /**
 * Check if we have a timer set.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api public
 */
      Tick.prototype.active = function active(name) {
        return name in this.timers;
      };

      /**
 * Properly clean up all timeout references. If no arguments are supplied we
 * will attempt to clear every single timer that is present.
 *
 * @param {Arguments} ..args.. The names of the timeouts we need to clear
 * @returns {Tick}
 * @api public
 */
      Tick.prototype.clear = function clear() {
        let args = arguments.length ? arguments : [];
        const tick = this;
        let timer;
        let i;
        let l;

        if (args.length === 1 && typeof args[0] === 'string') {
          args = args[0].split(/[, ]+/);
        }

        if (!args.length) {
          for (timer in tick.timers) {
            if (has.call(tick.timers, timer)) args.push(timer);
          }
        }

        for (i = 0, l = args.length; i < l; i++) {
          timer = tick.timers[args[i]];

          if (!timer) continue;
          timer.clear(timer.timer);

          timer.fns = timer.timer = timer.clear = null;
          delete tick.timers[args[i]];
        }

        return tick;
      };

      /**
 * Adjust a timeout or interval to a new duration.
 *
 * @returns {Tick}
 * @api public
 */
      Tick.prototype.adjust = function adjust(name, time) {
        let interval;
        const tick = this;
        const tock = ms(time);
        const timer = tick.timers[name];

        if (!timer) return tick;

        interval = timer.clear === unsetInterval;
        timer.clear(timer.timer);
        timer.start = +(new Date());
        timer.duration = tock;
        timer.timer = (interval ? setInterval : setTimeout)(tick.tock(name, !interval), tock);

        return tick;
      };

      /**
 * We will no longer use this module, prepare your self for global cleanups.
 *
 * @returns {Boolean}
 * @api public
 */
      Tick.prototype.end = Tick.prototype.destroy = function end() {
        if (!this.context) return false;

        this.clear();
        this.context = this.timers = null;

        return true;
      };

      //
      // Expose the timer factory.
      //
      Tick.Timer = Timer;
      module.exports = Tick;
    }).call(this, _dereq_('timers').setImmediate, _dereq_('timers').clearImmediate);
  }, { millisecond: 5, timers: 13 }],
  13: [function (_dereq_, module, exports) {
    (function (setImmediate, clearImmediate) {
      const { nextTick } = _dereq_('process/browser.js');
      const { apply } = Function.prototype;
      const { slice } = Array.prototype;
      const immediateIds = {};
      let nextImmediateId = 0;

      // DOM APIs, for completeness

      exports.setTimeout = function () {
        return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
      };
      exports.setInterval = function () {
        return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
      };
      exports.clearTimeout =
exports.clearInterval = function (timeout) { timeout.close(); };

      function Timeout(id, clearFn) {
        this._id = id;
        this._clearFn = clearFn;
      }
      Timeout.prototype.unref = Timeout.prototype.ref = function () {};
      Timeout.prototype.close = function () {
        this._clearFn.call(window, this._id);
      };

      // Does not start the time, just sets up the members needed.
      exports.enroll = function (item, msecs) {
        clearTimeout(item._idleTimeoutId);
        item._idleTimeout = msecs;
      };

      exports.unenroll = function (item) {
        clearTimeout(item._idleTimeoutId);
        item._idleTimeout = -1;
      };

      exports._unrefActive = exports.active = function (item) {
        clearTimeout(item._idleTimeoutId);

        const msecs = item._idleTimeout;
        if (msecs >= 0) {
          item._idleTimeoutId = setTimeout(function onTimeout() {
            if (item._onTimeout) item._onTimeout();
          }, msecs);
        }
      };

      // That's not how node.js implements it but the exposed api is the same.
      exports.setImmediate = typeof setImmediate === 'function' ? setImmediate : function (fn) {
        const id = nextImmediateId++;
        const args = arguments.length < 2 ? false : slice.call(arguments, 1);

        immediateIds[id] = true;

        nextTick(function onNextTick() {
          if (immediateIds[id]) {
            // fn.call() is faster so we optimize for the common use-case
            // @see http://jsperf.com/call-apply-segu
            if (args) {
              fn.apply(null, args);
            } else {
              fn.call(null);
            }
            // Prevent ids from leaking
            exports.clearImmediate(id);
          }
        });

        return id;
      };

      exports.clearImmediate = typeof clearImmediate === 'function' ? clearImmediate : function (id) {
        delete immediateIds[id];
      };
    }).call(this, _dereq_('timers').setImmediate, _dereq_('timers').clearImmediate);
  }, { 'process/browser.js': 7, timers: 13 }],
  14: [function (_dereq_, module, exports) {
    (function (global) {
      const required = _dereq_('requires-port');
      const qs = _dereq_('querystringify');
      const slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;
      const protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;
      const whitespace = '[\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\\u2029\\uFEFF]';
      const left = new RegExp(`^${whitespace}+`);

      /**
 * Trim a given string.
 *
 * @param {String} str String to trim.
 * @public
 */
      function trimLeft(str) {
        return (str || '').toString().replace(left, '');
      }

      /**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
      const rules = [
        ['#', 'hash'], // Extract from the back.
        ['?', 'query'], // Extract from the back.
        function sanitize(address) { // Sanitize what is left of the address
          return address.replace('\\', '/');
        },
        ['/', 'pathname'], // Extract from the back.
        ['@', 'auth', 1], // Extract from the front.
        [NaN, 'host', undefined, 1, 1], // Set left over value.
        [/:(\d+)$/, 'port', undefined, 1], // RegExp the back.
        [NaN, 'hostname', undefined, 1, 1], // Set left over.
      ];

      /**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
      const ignore = { hash: 1, query: 1 };

      /**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @public
 */
      function lolcation(loc) {
        let globalVar;

        if (typeof window !== 'undefined') globalVar = window;
        else if (typeof global !== 'undefined') globalVar = global;
        else if (typeof self !== 'undefined') globalVar = self;
        else globalVar = {};

        const location = globalVar.location || {};
        loc = loc || location;

        let finaldestination = {};
        const type = typeof loc;
        let key;

        if (loc.protocol === 'blob:') {
          finaldestination = new Url(unescape(loc.pathname), {});
        } else if (type === 'string') {
          finaldestination = new Url(loc, {});
          for (key in ignore) delete finaldestination[key];
        } else if (type === 'object') {
          for (key in loc) {
            if (key in ignore) continue;
            finaldestination[key] = loc[key];
          }

          if (finaldestination.slashes === undefined) {
            finaldestination.slashes = slashes.test(loc.href);
          }
        }

        return finaldestination;
      }

      /**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

      /**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @private
 */
      function extractProtocol(address) {
        address = trimLeft(address);
        const match = protocolre.exec(address);

        return {
          protocol: match[1] ? match[1].toLowerCase() : '',
          slashes: !!match[2],
          rest: match[3],
        };
      }

      /**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @private
 */
      function resolve(relative, base) {
        if (relative === '') return base;

        const path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'));
        let i = path.length;
        const last = path[i - 1];
        let unshift = false;
        let up = 0;

        while (i--) {
          if (path[i] === '.') {
            path.splice(i, 1);
          } else if (path[i] === '..') {
            path.splice(i, 1);
            up++;
          } else if (up) {
            if (i === 0) unshift = true;
            path.splice(i, 1);
            up--;
          }
        }

        if (unshift) path.unshift('');
        if (last === '.' || last === '..') path.push('');

        return path.join('/');
      }

      /**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * It is worth noting that we should not use `URL` as class name to prevent
 * clashes with the global URL instance that got introduced in browsers.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} [location] Location defaults for relative paths.
 * @param {Boolean|Function} [parser] Parser for the query string.
 * @private
 */
      function Url(address, location, parser) {
        address = trimLeft(address);

        if (!(this instanceof Url)) {
          return new Url(address, location, parser);
        }

        let relative; let extracted; let parse; let instruction; let index; let key;
        const instructions = rules.slice();
        const type = typeof location;
        const url = this;
        let i = 0;

        //
        // The following if statements allows this module two have compatibility with
        // 2 different API:
        //
        // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
        //    where the boolean indicates that the query string should also be parsed.
        //
        // 2. The `URL` interface of the browser which accepts a URL, object as
        //    arguments. The supplied object will be used as default values / fall-back
        //    for relative paths.
        //
        if (type !== 'object' && type !== 'string') {
          parser = location;
          location = null;
        }

        if (parser && typeof parser !== 'function') parser = qs.parse;

        location = lolcation(location);

        //
        // Extract protocol information before running the instructions.
        //
        extracted = extractProtocol(address || '');
        relative = !extracted.protocol && !extracted.slashes;
        url.slashes = extracted.slashes || relative && location.slashes;
        url.protocol = extracted.protocol || location.protocol || '';
        address = extracted.rest;

        //
        // When the authority component is absent the URL starts with a path
        // component.
        //
        if (!extracted.slashes) instructions[3] = [/(.*)/, 'pathname'];

        for (; i < instructions.length; i++) {
          instruction = instructions[i];

          if (typeof instruction === 'function') {
            address = instruction(address);
            continue;
          }

          parse = instruction[0];
          key = instruction[1];

          if (parse !== parse) {
            url[key] = address;
          } else if (typeof parse === 'string') {
            if (~(index = address.indexOf(parse))) {
              if (typeof instruction[2] === 'number') {
                url[key] = address.slice(0, index);
                address = address.slice(index + instruction[2]);
              } else {
                url[key] = address.slice(index);
                address = address.slice(0, index);
              }
            }
          } else if ((index = parse.exec(address))) {
            url[key] = index[1];
            address = address.slice(0, index.index);
          }

          url[key] = url[key] || (
            relative && instruction[3] ? location[key] || '' : ''
          );

          //
          // Hostname, host and protocol should be lowercased so they can be used to
          // create a proper `origin`.
          //
          if (instruction[4]) url[key] = url[key].toLowerCase();
        }

        //
        // Also parse the supplied query string in to an object. If we're supplied
        // with a custom parser as function use that instead of the default build-in
        // parser.
        //
        if (parser) url.query = parser(url.query);

        //
        // If the URL is relative, resolve the pathname against the base URL.
        //
        if (
          relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
        ) {
          url.pathname = resolve(url.pathname, location.pathname);
        }

        //
        // We should not add port numbers if they are already the default port number
        // for a given protocol. As the host also contains the port number we're going
        // override it with the hostname which contains no port number.
        //
        if (!required(url.port, url.protocol)) {
          url.host = url.hostname;
          url.port = '';
        }

        //
        // Parse down the `auth` for the username and password.
        //
        url.username = url.password = '';
        if (url.auth) {
          instruction = url.auth.split(':');
          url.username = instruction[0] || '';
          url.password = instruction[1] || '';
        }

        url.origin = url.protocol && url.host && url.protocol !== 'file:'
          ? `${url.protocol}//${url.host}`
          : 'null';

        //
        // The href is just the compiled result.
        //
        url.href = url.toString();
      }

      /**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL} URL instance for chaining.
 * @public
 */
      function set(part, value, fn) {
        const url = this;

        switch (part) {
        case 'query':
          if (typeof value === 'string' && value.length) {
            value = (fn || qs.parse)(value);
          }

          url[part] = value;
          break;

        case 'port':
          url[part] = value;

          if (!required(value, url.protocol)) {
            url.host = url.hostname;
            url[part] = '';
          } else if (value) {
            url.host = `${url.hostname}:${value}`;
          }

          break;

        case 'hostname':
          url[part] = value;

          if (url.port) value += `:${url.port}`;
          url.host = value;
          break;

        case 'host':
          url[part] = value;

          if (/:\d+$/.test(value)) {
            value = value.split(':');
            url.port = value.pop();
            url.hostname = value.join(':');
          } else {
            url.hostname = value;
            url.port = '';
          }

          break;

        case 'protocol':
          url.protocol = value.toLowerCase();
          url.slashes = !fn;
          break;

        case 'pathname':
        case 'hash':
          if (value) {
            const char = part === 'pathname' ? '/' : '#';
            url[part] = value.charAt(0) !== char ? char + value : value;
          } else {
            url[part] = value;
          }
          break;

        default:
          url[part] = value;
        }

        for (let i = 0; i < rules.length; i++) {
          const ins = rules[i];

          if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
        }

        url.origin = url.protocol && url.host && url.protocol !== 'file:'
          ? `${url.protocol}//${url.host}`
          : 'null';

        url.href = url.toString();

        return url;
      }

      /**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String} Compiled version of the URL.
 * @public
 */
      function toString(stringify) {
        if (!stringify || typeof stringify !== 'function') stringify = qs.stringify;

        let query;
        const url = this;
        let { protocol } = url;

        if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

        let result = protocol + (url.slashes ? '//' : '');

        if (url.username) {
          result += url.username;
          if (url.password) result += `:${url.password}`;
          result += '@';
        }

        result += url.host + url.pathname;

        query = typeof url.query === 'object' ? stringify(url.query) : url.query;
        if (query) result += query.charAt(0) !== '?' ? `?${query}` : query;

        if (url.hash) result += url.hash;

        return result;
      }

      Url.prototype = { set, toString };

      //
      // Expose the URL parser and some additional properties that might be useful for
      // others or testing.
      //
      Url.extractProtocol = extractProtocol;
      Url.location = lolcation;
      Url.trimLeft = trimLeft;
      Url.qs = qs;

      module.exports = Url;
    }).call(this, typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {});
  }, { querystringify: 8, 'requires-port': 11 }],
  15: [function (_dereq_, module, exports) {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('');
    const length = 64;
    const map = {};
    let seed = 0;
    let i = 0;
    let prev;

    /**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
    function encode(num) {
      let encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
    function decode(str) {
      let decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }

    /**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
    function yeast() {
      const now = encode(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return `${now}.${encode(seed++)}`;
    }

    //
    // Map each character to its index.
    //
    for (; i < length; i++) map[alphabet[i]] = i;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode;
    yeast.decode = decode;
    module.exports = yeast;
  }, {}],
  16: [function (_dereq_, module, exports) {
    /* globals require, define */


    const EventEmitter = _dereq_('eventemitter3');
    const TickTock = _dereq_('tick-tock');
    const Recovery = _dereq_('recovery');
    const qs = _dereq_('querystringify');
    const inherits = _dereq_('inherits');
    const destroy = _dereq_('demolish');
    const yeast = _dereq_('yeast');
    const u2028 = /\u2028/g;
    const u2029 = /\u2029/g;

    /**
 * Context assertion, ensure that some of our public Primus methods are called
 * with the correct context to ensure that
 *
 * @param {Primus} self The context of the function.
 * @param {String} method The method name.
 * @api private
 */
    function context(self, method) {
      if (self instanceof Primus) return;

      const failure = new Error(`Primus#${method}'s context should called with a Primus instance`);

      if (typeof self.listeners !== 'function' || !self.listeners('error').length) {
        throw failure;
      }

      self.emit('error', failure);
    }

    //
    // Sets the default connection URL, it uses the default origin of the browser
    // when supported but degrades for older browsers. In Node.js, we cannot guess
    // where the user wants to connect to, so we just default to localhost.
    //
    let defaultUrl;

    try {
      if (location.origin) {
        defaultUrl = location.origin;
      } else {
        defaultUrl = `${location.protocol}//${location.host}`;
      }
    } catch (e) {
      defaultUrl = 'http://127.0.0.1';
    }

    /**
 * Primus is a real-time library agnostic framework for establishing real-time
 * connections with servers.
 *
 * Options:
 * - reconnect, configuration for the reconnect process.
 * - manual, don't automatically call `.open` to start the connection.
 * - websockets, force the use of WebSockets, even when you should avoid them.
 * - timeout, connect timeout, server didn't respond in a timely manner.
 * - pingTimeout, The maximum amount of time to wait for the server to send a ping.
 * - network, Use network events as leading method for network connection drops.
 * - strategy, Reconnection strategies.
 * - transport, Transport options.
 * - url, uri, The URL to use connect with the server.
 *
 * @constructor
 * @param {String} url The URL of your server.
 * @param {Object} options The configuration.
 * @api public
 */
    function Primus(url, options) {
      if (!(this instanceof Primus)) return new Primus(url, options);

      Primus.Stream.call(this);

      if (typeof this.client !== 'function') {
        return this.critical(new Error(
          'The client library has not been compiled correctly, see ' +
      'https://github.com/primus/primus#client-library for more details',
        ));
      }

      if (typeof url === 'object') {
        options = url;
        url = options.url || options.uri || defaultUrl;
      } else {
        options = options || {};
      }

      if ('ping' in options || 'pong' in options) {
        return this.critical(new Error(
          'The `ping` and `pong` options have been removed',
        ));
      }

      const primus = this;

      // The maximum number of messages that can be placed in queue.
      options.queueSize = 'queueSize' in options ? options.queueSize : Infinity;

      // Connection timeout duration.
      options.timeout = 'timeout' in options ? options.timeout : 10e3;

      // Stores the back off configuration.
      options.reconnect = 'reconnect' in options ? options.reconnect : {};

      // Heartbeat ping interval.
      options.pingTimeout = 'pingTimeout' in options ? options.pingTimeout : 45000;

      // Reconnect strategies.
      options.strategy = 'strategy' in options ? options.strategy : [];

      // Custom transport options.
      options.transport = 'transport' in options ? options.transport : {};

      primus.buffer = []; // Stores premature send data.
      primus.writable = true; // Silly stream compatibility.
      primus.readable = true; // Silly stream compatibility.
      primus.url = primus.parse(url || defaultUrl); // Parse the URL to a readable format.
      primus.readyState = Primus.CLOSED; // The readyState of the connection.
      primus.options = options; // Reference to the supplied options.
      primus.timers = new TickTock(this); // Contains all our timers.
      primus.socket = null; // Reference to the internal connection.
      primus.disconnect = false; // Did we receive a disconnect packet?
      primus.transport = options.transport; // Transport options.
      primus.transformers = { // Message transformers.
        outgoing: [],
        incoming: [],
      };

      //
      // Create our reconnection instance.
      //
      primus.recovery = new Recovery(options.reconnect);

      //
      // Parse the reconnection strategy. It can have the following strategies:
      //
      // - timeout: Reconnect when we have a network timeout.
      // - disconnect: Reconnect when we have an unexpected disconnect.
      // - online: Reconnect when we're back online.
      //
      if (typeof options.strategy === 'string') {
        options.strategy = options.strategy.split(/\s?,\s?/g);
      }

      if (options.strategy === false) {
        //
        // Strategies are disabled, but we still need an empty array to join it in
        // to nothing.
        //
        options.strategy = [];
      } else if (!options.strategy.length) {
        options.strategy.push('disconnect', 'online');

        //
        // Timeout based reconnection should only be enabled conditionally. When
        // authorization is enabled it could trigger.
        //
        if (!this.authorization) options.strategy.push('timeout');
      }

      options.strategy = options.strategy.join(',').toLowerCase();

      //
      // Force the use of WebSockets, even when we've detected some potential
      // broken WebSocket implementation.
      //
      if ('websockets' in options) {
        primus.AVOID_WEBSOCKETS = !options.websockets;
      }

      //
      // Force or disable the use of NETWORK events as leading client side
      // disconnection detection.
      //
      if ('network' in options) {
        primus.NETWORK_EVENTS = options.network;
      }

      //
      // Check if the user wants to manually initialise a connection. If they don't,
      // we want to do it after a really small timeout so we give the users enough
      // time to listen for `error` events etc.
      //
      if (!options.manual) {
        primus.timers.setTimeout('open', function open() {
          primus.timers.clear('open');
          primus.open();
        }, 0);
      }

      primus.initialise(options);
    }

    /**
 * Simple require wrapper to make browserify, node and require.js play nice.
 *
 * @param {String} name The module to require.
 * @returns {Object|Undefined} The module that we required.
 * @api private
 */
    Primus.requires = Primus.require = function requires(name) {
      if (typeof _dereq_ !== 'function') return undefined;

      return !(typeof define === 'function' && define.amd)
        ? _dereq_(name)
        : undefined;
    };

    //
    // It's possible that we're running in Node.js or in a Node.js compatible
    // environment. In this cases we try to inherit from the Stream base class.
    //
    try {
      Primus.Stream = Primus.requires('stream');
    } catch (e) { }

    if (!Primus.Stream) Primus.Stream = EventEmitter;

    inherits(Primus, Primus.Stream);

    /**
 * Primus readyStates, used internally to set the correct ready state.
 *
 * @type {Number}
 * @private
 */
    Primus.OPENING = 1; // We're opening the connection.
    Primus.CLOSED = 2; // No active connection.
    Primus.OPEN = 3; // The connection is open.

    /**
 * Are we working with a potentially broken WebSockets implementation? This
 * boolean can be used by transformers to remove `WebSockets` from their
 * supported transports.
 *
 * @type {Boolean}
 * @private
 */
    Primus.prototype.AVOID_WEBSOCKETS = false;

    /**
 * Some browsers support registering emitting `online` and `offline` events when
 * the connection has been dropped on the client. We're going to detect it in
 * a simple `try {} catch (e) {}` statement so we don't have to do complicated
 * feature detection.
 *
 * @type {Boolean}
 * @private
 */
    Primus.prototype.NETWORK_EVENTS = false;
    Primus.prototype.online = true;

    try {
      if (
        Primus.prototype.NETWORK_EVENTS = 'onLine' in navigator
    && (window.addEventListener || document.body.attachEvent)
      ) {
        if (!navigator.onLine) {
          Primus.prototype.online = false;
        }
      }
    } catch (e) { }

    /**
 * The Ark contains all our plugins definitions. It's namespaced by
 * name => plugin.
 *
 * @type {Object}
 * @private
 */
    Primus.prototype.ark = {};

    /**
 * Simple emit wrapper that returns a function that emits an event once it's
 * called. This makes it easier for transports to emit specific events.
 *
 * @returns {Function} A function that will emit the event when called.
 * @api public
 */
    Primus.prototype.emits = _dereq_('emits');

    /**
 * Return the given plugin.
 *
 * @param {String} name The name of the plugin.
 * @returns {Object|undefined} The plugin or undefined.
 * @api public
 */
    Primus.prototype.plugin = function plugin(name) {
      context(this, 'plugin');

      if (name) return this.ark[name];

      const plugins = {};

      for (name in this.ark) {
        plugins[name] = this.ark[name];
      }

      return plugins;
    };

    /**
 * Checks if the given event is an emitted event by Primus.
 *
 * @param {String} evt The event name.
 * @returns {Boolean} Indication of the event is reserved for internal use.
 * @api public
 */
    Primus.prototype.reserved = function reserved(evt) {
      return (/^(incoming|outgoing)::/).test(evt)
  || evt in this.reserved.events;
    };

    /**
 * The actual events that are used by the client.
 *
 * @type {Object}
 * @public
 */
    Primus.prototype.reserved.events = {
      'reconnect scheduled': 1,
      'reconnect timeout': 1,
      readyStateChange: 1,
      'reconnect failed': 1,
      reconnected: 1,
      reconnect: 1,
      offline: 1,
      timeout: 1,
      destroy: 1,
      online: 1,
      error: 1,
      close: 1,
      open: 1,
      data: 1,
      end: 1,
    };

    /**
 * Initialise the Primus and setup all parsers and internal listeners.
 *
 * @param {Object} options The original options object.
 * @returns {Primus}
 * @api private
 */
    Primus.prototype.initialise = function initialise(options) {
      const primus = this;

      primus.recovery
        .on('reconnected', primus.emits('reconnected'))
        .on('reconnect failed', primus.emits('reconnect failed', function failed(next) {
          primus.emit('end');
          next();
        }))
        .on('reconnect timeout', primus.emits('reconnect timeout'))
        .on('reconnect scheduled', primus.emits('reconnect scheduled'))
        .on('reconnect', primus.emits('reconnect', function reconnect(next) {
          primus.emit('outgoing::reconnect');
          next();
        }));

      primus.on('outgoing::open', function opening() {
        const { readyState } = primus;

        primus.readyState = Primus.OPENING;
        if (readyState !== primus.readyState) {
          primus.emit('readyStateChange', 'opening');
        }
      });

      primus.on('incoming::open', function opened() {
        const { readyState } = primus;

        if (primus.recovery.reconnecting()) {
          primus.recovery.reconnected();
        }

        //
        // The connection has been opened so we should set our state to
        // (writ|read)able so our stream compatibility works as intended.
        //
        primus.writable = true;
        primus.readable = true;

        //
        // Make sure we are flagged as `online` as we've successfully opened the
        // connection.
        //
        if (!primus.online) {
          primus.online = true;
          primus.emit('online');
        }

        primus.readyState = Primus.OPEN;
        if (readyState !== primus.readyState) {
          primus.emit('readyStateChange', 'open');
        }

        primus.heartbeat();

        if (primus.buffer.length) {
          const data = primus.buffer.slice();
          const { length } = data;
          let i = 0;

          primus.buffer.length = 0;

          for (; i < length; i++) {
            primus._write(data[i]);
          }
        }

        primus.emit('open');
      });

      primus.on('incoming::ping', function ping(time) {
        primus.online = true;
        primus.heartbeat();
        primus.emit('outgoing::pong', time);
        primus._write(`primus::pong::${time}`);
      });

      primus.on('incoming::error', function error(e) {
        const connect = primus.timers.active('connect');
        let err = e;

        //
        // When the error is not an Error instance we try to normalize it.
        //
        if (typeof e === 'string') {
          err = new Error(e);
        } else if (!(e instanceof Error) && typeof e === 'object') {
          //
          // BrowserChannel and SockJS returns an object which contains some
          // details of the error. In order to have a proper error we "copy" the
          // details in an Error instance.
          //
          err = new Error(e.message || e.reason);
          for (const key in e) {
            if (Object.prototype.hasOwnProperty.call(e, key)) err[key] = e[key];
          }
        }
        //
        // We're still doing a reconnect attempt, it could be that we failed to
        // connect because the server was down. Failing connect attempts should
        // always emit an `error` event instead of a `open` event.
        //
        //
        if (primus.recovery.reconnecting()) return primus.recovery.reconnected(err);
        if (primus.listeners('error').length) primus.emit('error', err);

        //
        // We received an error while connecting, this most likely the result of an
        // unauthorized access to the server.
        //
        if (connect) {
          if (~primus.options.strategy.indexOf('timeout')) {
            primus.recovery.reconnect();
          } else {
            primus.end();
          }
        }
      });

      primus.on('incoming::data', function message(raw) {
        primus.decoder(raw, function decoding(err, data) {
          //
          // Do a "safe" emit('error') when we fail to parse a message. We don't
          // want to throw here as listening to errors should be optional.
          //
          if (err) return primus.listeners('error').length && primus.emit('error', err);

          //
          // Handle all "primus::" prefixed protocol messages.
          //
          if (primus.protocol(data)) return;
          primus.transforms(primus, primus, 'incoming', data, raw);
        });
      });

      primus.on('incoming::end', function end() {
        const { readyState } = primus;

        //
        // This `end` started with the receiving of a primus::server::close packet
        // which indicated that the user/developer on the server closed the
        // connection and it was not a result of a network disruption. So we should
        // kill the connection without doing a reconnect.
        //
        if (primus.disconnect) {
          primus.disconnect = false;

          return primus.end();
        }

        //
        // Always set the readyState to closed, and if we're still connecting, close
        // the connection so we're sure that everything after this if statement block
        // is only executed because our readyState is set to `open`.
        //
        primus.readyState = Primus.CLOSED;
        if (readyState !== primus.readyState) {
          primus.emit('readyStateChange', 'end');
        }

        if (primus.timers.active('connect')) primus.end();
        if (readyState !== Primus.OPEN) {
          return primus.recovery.reconnecting()
            ? primus.recovery.reconnect()
            : false;
        }

        this.writable = false;
        this.readable = false;

        //
        // Clear all timers in case we're not going to reconnect.
        //
        this.timers.clear();

        //
        // Fire the `close` event as an indication of connection disruption.
        // This is also fired by `primus#end` so it is emitted in all cases.
        //
        primus.emit('close');

        //
        // The disconnect was unintentional, probably because the server has
        // shutdown, so if the reconnection is enabled start a reconnect procedure.
        //
        if (~primus.options.strategy.indexOf('disconnect')) {
          return primus.recovery.reconnect();
        }

        primus.emit('outgoing::end');
        primus.emit('end');
      });

      //
      // Setup the real-time client.
      //
      primus.client();

      //
      // Process the potential plugins.
      //
      for (const plugin in primus.ark) {
        primus.ark[plugin].call(primus, primus, options);
      }

      //
      // NOTE: The following code is only required if we're supporting network
      // events as it requires access to browser globals.
      //
      if (!primus.NETWORK_EVENTS) return primus;

      /**
   * Handler for offline notifications.
   *
   * @api private
   */
      primus.offlineHandler = function offline() {
        if (!primus.online) return; // Already or still offline, bailout.

        primus.online = false;
        primus.emit('offline');
        primus.end();

        //
        // It is certainly possible that we're in a reconnection loop and that the
        // user goes offline. In this case we want to kill the existing attempt so
        // when the user goes online, it will attempt to reconnect freshly again.
        //
        primus.recovery.reset();
      };

      /**
   * Handler for online notifications.
   *
   * @api private
   */
      primus.onlineHandler = function online() {
        if (primus.online) return; // Already or still online, bailout.

        primus.online = true;
        primus.emit('online');

        if (~primus.options.strategy.indexOf('online')) {
          primus.recovery.reconnect();
        }
      };

      if (window.addEventListener) {
        window.addEventListener('offline', primus.offlineHandler, false);
        window.addEventListener('online', primus.onlineHandler, false);
      } else if (document.body.attachEvent) {
        document.body.attachEvent('onoffline', primus.offlineHandler);
        document.body.attachEvent('ononline', primus.onlineHandler);
      }

      return primus;
    };

    /**
 * Really dead simple protocol parser. We simply assume that every message that
 * is prefixed with `primus::` could be used as some sort of protocol definition
 * for Primus.
 *
 * @param {String} msg The data.
 * @returns {Boolean} Is a protocol message.
 * @api private
 */
    Primus.prototype.protocol = function protocol(msg) {
      if (
        typeof msg !== 'string'
    || msg.indexOf('primus::') !== 0
      ) return false;

      const last = msg.indexOf(':', 8);
      const value = msg.slice(last + 2);

      switch (msg.slice(8, last)) {
      case 'ping':
        this.emit('incoming::ping', +value);
        break;

      case 'server':
        //
        // The server is closing the connection, forcefully disconnect so we don't
        // reconnect again.
        //
        if (value === 'close') {
          this.disconnect = true;
        }
        break;

      case 'id':
        this.emit('incoming::id', value);
        break;

        //
        // Unknown protocol, somebody is probably sending `primus::` prefixed
        // messages.
        //
      default:
        return false;
      }

      return true;
    };

    /**
 * Execute the set of message transformers from Primus on the incoming or
 * outgoing message.
 * This function and it's content should be in sync with Spark#transforms in
 * spark.js.
 *
 * @param {Primus} primus Reference to the Primus instance with message transformers.
 * @param {Spark|Primus} connection Connection that receives or sends data.
 * @param {String} type The type of message, 'incoming' or 'outgoing'.
 * @param {Mixed} data The data to send or that has been received.
 * @param {String} raw The raw encoded data.
 * @returns {Primus}
 * @api public
 */
    Primus.prototype.transforms = function transforms(primus, connection, type, data, raw) {
      const packet = { data };
      const fns = primus.transformers[type];

      //
      // Iterate in series over the message transformers so we can allow optional
      // asynchronous execution of message transformers which could for example
      // retrieve additional data from the server, do extra decoding or even
      // message validation.
      //
      (function transform(index, done) {
        const transformer = fns[index++];

        if (!transformer) return done();

        if (transformer.length === 1) {
          if (transformer.call(connection, packet) === false) {
            //
            // When false is returned by an incoming transformer it means that's
            // being handled by the transformer and we should not emit the `data`
            // event.
            //
            return;
          }

          return transform(index, done);
        }

        transformer.call(connection, packet, function finished(err, arg) {
          if (err) return connection.emit('error', err);
          if (arg === false) return;

          transform(index, done);
        });
      }(0, function done() {
        //
        // We always emit 2 arguments for the data event, the first argument is the
        // parsed data and the second argument is the raw string that we received.
        // This allows you, for example, to do some validation on the parsed data
        // and then save the raw string in your database without the stringify
        // overhead.
        //
        if (type === 'incoming') return connection.emit('data', packet.data, raw);

        connection._write(packet.data);
      }));

      return this;
    };

    /**
 * Retrieve the current id from the server.
 *
 * @param {Function} fn Callback function.
 * @returns {Primus}
 * @api public
 */
    Primus.prototype.id = function id(fn) {
      if (this.socket && this.socket.id) return fn(this.socket.id);

      this._write('primus::id::');
      return this.once('incoming::id', fn);
    };

    /**
 * Establish a connection with the server. When this function is called we
 * assume that we don't have any open connections. If you do call it when you
 * have a connection open, it could cause duplicate connections.
 *
 * @returns {Primus}
 * @api public
 */
    Primus.prototype.open = function open() {
      context(this, 'open');

      //
      // Only start a `connection timeout` procedure if we're not reconnecting as
      // that shouldn't count as an initial connection. This should be started
      // before the connection is opened to capture failing connections and kill the
      // timeout.
      //
      if (!this.recovery.reconnecting() && this.options.timeout) this.timeout();

      this.emit('outgoing::open');
      return this;
    };

    /**
 * Send a new message.
 *
 * @param {Mixed} data The data that needs to be written.
 * @returns {Boolean} Always returns true as we don't support back pressure.
 * @api public
 */
    Primus.prototype.write = function write(data) {
      context(this, 'write');
      this.transforms(this, this, 'outgoing', data);

      return true;
    };

    /**
 * The actual message writer.
 *
 * @param {Mixed} data The message that needs to be written.
 * @returns {Boolean} Successful write to the underlaying transport.
 * @api private
 */
    Primus.prototype._write = function write(data) {
      const primus = this;

      //
      // The connection is closed, normally this would already be done in the
      // `spark.write` method, but as `_write` is used internally, we should also
      // add the same check here to prevent potential crashes by writing to a dead
      // socket.
      //
      if (Primus.OPEN !== primus.readyState) {
        //
        // If the buffer is at capacity, remove the first item.
        //
        if (this.buffer.length === this.options.queueSize) {
          this.buffer.splice(0, 1);
        }

        this.buffer.push(data);
        return false;
      }

      primus.encoder(data, function encoded(err, packet) {
        //
        // Do a "safe" emit('error') when we fail to parse a message. We don't
        // want to throw here as listening to errors should be optional.
        //
        if (err) return primus.listeners('error').length && primus.emit('error', err);

        //
        // Hack 1: \u2028 and \u2029 are allowed inside a JSON string, but JavaScript
        // defines them as newline separators. Unescaped control characters are not
        // allowed inside JSON strings, so this causes an error at parse time. We
        // work around this issue by escaping these characters. This can cause
        // errors with JSONP requests or if the string is just evaluated.
        //
        if (typeof packet === 'string') {
          if (~packet.indexOf('\u2028')) packet = packet.replace(u2028, '\\u2028');
          if (~packet.indexOf('\u2029')) packet = packet.replace(u2029, '\\u2029');
        }

        primus.emit('outgoing::data', packet);
      });

      return true;
    };

    /**
 * Set a timer that, upon expiration, closes the client.
 *
 * @returns {Primus}
 * @api private
 */
    Primus.prototype.heartbeat = function heartbeat() {
      if (!this.options.pingTimeout) return this;

      this.timers.clear('heartbeat');
      this.timers.setTimeout('heartbeat', function expired() {
        //
        // The network events already captured the offline event.
        //
        if (!this.online) return;

        this.online = false;
        this.emit('offline');
        this.emit('incoming::end');
      }, this.options.pingTimeout);

      return this;
    };

    /**
 * Start a connection timeout.
 *
 * @returns {Primus}
 * @api private
 */
    Primus.prototype.timeout = function timeout() {
      const primus = this;

      /**
   * Remove all references to the timeout listener as we've received an event
   * that can be used to determine state.
   *
   * @api private
   */
      function remove() {
        primus.removeListener('error', remove)
          .removeListener('open', remove)
          .removeListener('end', remove)
          .timers.clear('connect');
      }

      primus.timers.setTimeout('connect', function expired() {
        remove(); // Clean up old references.

        if (primus.readyState === Primus.OPEN || primus.recovery.reconnecting()) {
          return;
        }

        primus.emit('timeout');

        //
        // We failed to connect to the server.
        //
        if (~primus.options.strategy.indexOf('timeout')) {
          primus.recovery.reconnect();
        } else {
          primus.end();
        }
      }, primus.options.timeout);

      return primus.on('error', remove)
        .on('open', remove)
        .on('end', remove);
    };

    /**
 * Close the connection completely.
 *
 * @param {Mixed} data last packet of data.
 * @returns {Primus}
 * @api public
 */
    Primus.prototype.end = function end(data) {
      context(this, 'end');

      if (
        this.readyState === Primus.CLOSED
    && !this.timers.active('connect')
    && !this.timers.active('open')
      ) {
        //
        // If we are reconnecting stop the reconnection procedure.
        //
        if (this.recovery.reconnecting()) {
          this.recovery.reset();
          this.emit('end');
        }

        return this;
      }

      if (data !== undefined) this.write(data);

      this.writable = false;
      this.readable = false;

      const { readyState } = this;
      this.readyState = Primus.CLOSED;

      if (readyState !== this.readyState) {
        this.emit('readyStateChange', 'end');
      }

      this.timers.clear();
      this.emit('outgoing::end');
      this.emit('close');
      this.emit('end');

      return this;
    };

    /**
 * Completely demolish the Primus instance and forcefully nuke all references.
 *
 * @returns {Boolean}
 * @api public
 */
    Primus.prototype.destroy = destroy('url timers options recovery socket transport transformers', {
      before: 'end',
      after: ['removeAllListeners', function detach() {
        if (!this.NETWORK_EVENTS) return;

        if (window.addEventListener) {
          window.removeEventListener('offline', this.offlineHandler);
          window.removeEventListener('online', this.onlineHandler);
        } else if (document.body.attachEvent) {
          document.body.detachEvent('onoffline', this.offlineHandler);
          document.body.detachEvent('ononline', this.onlineHandler);
        }
      }],
    });

    /**
 * Create a shallow clone of a given object.
 *
 * @param {Object} obj The object that needs to be cloned.
 * @returns {Object} Copy.
 * @api private
 */
    Primus.prototype.clone = function clone(obj) {
      return this.merge({}, obj);
    };

    /**
 * Merge different objects in to one target object.
 *
 * @param {Object} target The object where everything should be merged in.
 * @returns {Object} Original target with all merged objects.
 * @api private
 */
    Primus.prototype.merge = function merge(target) {
      for (var i = 1, key, obj; i < arguments.length; i++) {
        obj = arguments[i];

        for (key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) target[key] = obj[key];
        }
      }

      return target;
    };

    /**
 * Parse the connection string.
 *
 * @type {Function}
 * @param {String} url Connection URL.
 * @returns {Object} Parsed connection.
 * @api private
 */
    Primus.prototype.parse = _dereq_('url-parse');

    /**
 * Parse a query string.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object} Parsed query string.
 * @api private
 */
    Primus.prototype.querystring = qs.parse;
    /**
 * Transform a query string object back into string equiv.
 *
 * @param {Object} obj The query string object.
 * @returns {String}
 * @api private
 */
    Primus.prototype.querystringify = qs.stringify;

    /**
 * Generates a connection URI.
 *
 * @param {String} protocol The protocol that should used to crate the URI.
 * @returns {String|options} The URL.
 * @api private
 */
    Primus.prototype.uri = function uri(options) {
      const { url } = this;
      const server = [];
      let qsa = false;

      //
      // Query strings are only allowed when we've received clearance for it.
      //
      if (options.query) qsa = true;

      options = options || {};
      options.protocol = 'protocol' in options
        ? options.protocol
        : 'http:';
      options.query = url.query && qsa
        ? url.query.slice(1)
        : false;
      options.secure = 'secure' in options
        ? options.secure
        : url.protocol === 'https:' || url.protocol === 'wss:';
      options.auth = 'auth' in options
        ? options.auth
        : url.auth;
      options.pathname = 'pathname' in options
        ? options.pathname
        : this.pathname;
      options.port = 'port' in options
        ? +options.port
        : +url.port || (options.secure ? 443 : 80);

      //
      // We need to make sure that we create a unique connection URL every time to
      // prevent back forward cache from becoming an issue. We're doing this by
      // forcing an cache busting query string in to the URL.
      //
      const querystring = this.querystring(options.query || '');
      querystring._primuscb = yeast();
      options.query = this.querystringify(querystring);

      //
      // Allow transformation of the options before we construct a full URL from it.
      //
      this.emit('outgoing::url', options);

      //
      // Automatically suffix the protocol so we can supply `ws:` and `http:` and
      // it gets transformed correctly.
      //
      server.push(options.secure ? options.protocol.replace(':', 's:') : options.protocol, '');

      server.push(options.auth ? `${options.auth}@${url.host}` : url.host);

      //
      // Pathnames are optional as some Transformers would just use the pathname
      // directly.
      //
      if (options.pathname) server.push(options.pathname.slice(1));

      //
      // Optionally add a search query.
      //
      if (qsa) server[server.length - 1] += `?${options.query}`;
      else delete options.query;

      if (options.object) return options;
      return server.join('/');
    };

    /**
 * Register a new message transformer. This allows you to easily manipulate incoming
 * and outgoing data which is particularity handy for plugins that want to send
 * meta data together with the messages.
 *
 * @param {String} type Incoming or outgoing
 * @param {Function} fn A new message transformer.
 * @returns {Primus}
 * @api public
 */
    Primus.prototype.transform = function transform(type, fn) {
      context(this, 'transform');

      if (!(type in this.transformers)) {
        return this.critical(new Error('Invalid transformer type'));
      }

      this.transformers[type].push(fn);
      return this;
    };

    /**
 * A critical error has occurred, if we have an `error` listener, emit it there.
 * If not, throw it, so we get a stack trace + proper error message.
 *
 * @param {Error} err The critical error.
 * @returns {Primus}
 * @api private
 */
    Primus.prototype.critical = function critical(err) {
      if (this.emit('error', err)) return this;

      throw err;
    };

    /**
 * Syntax sugar, adopt a Socket.IO like API.
 *
 * @param {String} url The URL we want to connect to.
 * @param {Object} options Connection options.
 * @returns {Primus}
 * @api public
 */
    Primus.connect = function connect(url, options) {
      return new Primus(url, options);
    };

    //
    // Expose the EventEmitter so it can be re-used by wrapping libraries we're also
    // exposing the Stream interface.
    //
    Primus.EventEmitter = EventEmitter;

    //
    // These libraries are automatically inserted at the server-side using the
    // Primus#library method.
    //
    Primus.prototype.client = function client() {
      const primus = this;
      let socket;

      //
      // Select an available WebSocket factory.
      //
      const Factory = (function factory() {
        if (typeof WebSocket !== 'undefined') return WebSocket;
        if (typeof MozWebSocket !== 'undefined') return MozWebSocket;

        try { return Primus.requires('ws'); } catch (e) {}

        return undefined;
      }());

      if (!Factory) {
        return primus.critical(new Error(
          'Missing required `ws` module. Please run `npm install --save ws`',
        ));
      }

      //
      // Connect to the given URL.
      //
      primus.on('outgoing::open', function opening() {
        primus.emit('outgoing::end');

        //
        // FireFox will throw an error when we try to establish a connection from
        // a secure page to an unsecured WebSocket connection. This is inconsistent
        // behaviour between different browsers. This should ideally be solved in
        // Primus when we connect.
        //
        try {
          const options = {
            protocol: primus.url.protocol === 'ws+unix:' ? 'ws+unix:' : 'ws:',
            query: true,
          };

          //
          // Only allow primus.transport object in Node.js, it will throw in
          // browsers with a TypeError if we supply to much arguments.
          //
          if (Factory.length === 3) {
            if (options.protocol === 'ws+unix:') {
              options.pathname = `${primus.url.pathname}:${primus.pathname}`;
            }
            primus.socket = socket = new Factory(
              primus.uri(options), // URL
              [], // Sub protocols
              primus.transport, // options.
            );
          } else {
            primus.socket = socket = new Factory(primus.uri(options));
            socket.binaryType = 'arraybuffer';
          }
        } catch (e) { return primus.emit('error', e); }

        //
        // Setup the Event handlers.
        //
        socket.onopen = primus.emits('incoming::open');
        socket.onerror = primus.emits('incoming::error');
        socket.onclose = primus.emits('incoming::end');
        socket.onmessage = primus.emits('incoming::data', function parse(next, evt) {
          next(undefined, evt.data);
        });
      });

      //
      // We need to write a new message to the socket.
      //
      primus.on('outgoing::data', function write(message) {
        if (!socket || socket.readyState !== Factory.OPEN) return;

        try { socket.send(message); } catch (e) { primus.emit('incoming::error', e); }
      });

      //
      // Attempt to reconnect the socket.
      //
      primus.on('outgoing::reconnect', function reconnect() {
        primus.emit('outgoing::open');
      });

      //
      // We need to close the socket.
      //
      primus.on('outgoing::end', function close() {
        if (!socket) return;

        socket.onerror = socket.onopen = socket.onclose = socket.onmessage = function () {};
        socket.close();
        socket = null;
      });
    };
    Primus.prototype.authorization = false;
    Primus.prototype.pathname = '/primus';
    Primus.prototype.encoder = function encoder(data, fn) {
      let err;

      try { data = JSON.stringify(data); } catch (e) { err = e; }

      fn(err, data);
    };
    Primus.prototype.decoder = function decoder(data, fn) {
      let err;

      if (typeof data !== 'string') return fn(err, data);

      try { data = JSON.parse(data); } catch (e) { err = e; }

      fn(err, data);
    };
    Primus.prototype.version = '7.3.4';

    if (
      typeof document !== 'undefined'
  && typeof navigator !== 'undefined'
    ) {
      //
      // Hack 2: If you press ESC in FireFox it will close all active connections.
      // Normally this makes sense, when your page is still loading. But versions
      // before FireFox 22 will close all connections including WebSocket connections
      // after page load. One way to prevent this is to do a `preventDefault()` and
      // cancel the operation before it bubbles up to the browsers default handler.
      // It needs to be added as `keydown` event, if it's added keyup it will not be
      // able to prevent the connection from being closed.
      //
      if (document.addEventListener) {
        document.addEventListener('keydown', function keydown(e) {
          if (e.keyCode !== 27 || !e.preventDefault) return;

          e.preventDefault();
        }, false);
      }

      //
      // Hack 3: This is a Mac/Apple bug only, when you're behind a reverse proxy or
      // have you network settings set to `automatic proxy discovery` the safari
      // browser will crash when the WebSocket constructor is initialised. There is
      // no way to detect the usage of these proxies available in JavaScript so we
      // need to do some nasty browser sniffing. This only affects Safari versions
      // lower then 5.1.4
      //
      const ua = (navigator.userAgent || '').toLowerCase();
      const parsed = ua.match(/.+(?:rv|it|ra|ie)[/: ](\d+)\.(\d+)(?:\.(\d+))?/) || [];
      const version = +[parsed[1], parsed[2]].join('.');

      if (
        !~ua.indexOf('chrome')
    && ~ua.indexOf('safari')
    && version < 534.54
      ) {
        Primus.prototype.AVOID_WEBSOCKETS = true;
      }
    }

    //
    // Expose the library.
    //
    module.exports = Primus;
  }, { demolish: 1, emits: 2, eventemitter3: 3, inherits: 4, querystringify: 8, recovery: 9, 'tick-tock': 12, 'url-parse': 14, yeast: 15 }] }, {}, [16])(16);
  Primus.prototype.ark.emitter = function () {};
  return Primus;
},
[
  function (Primus) {
    (function (Primus, undefined) {
      function spark(Spark, Emitter) {
        /**
   * `Primus#initialise` reference.
   */

        const { initialise } = Spark.prototype;

        /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

        Spark.prototype.initialise = function init() {
          if (!this.emitter) this.emitter = new Emitter(this);
          if (!this.__initialise) initialise.apply(this, arguments);
        };

        // Extend the Spark to add the send method. If `Spark.readable`
        // is not supported then we set the method on the prototype instead.
        if (!Spark.readable) Spark.prototype.send = send;
        else if (!Spark.prototype.send) Spark.readable('send', send);

        /**
   * Emits to this Spark.
   *
   * @param {String} ev The event
   * @param {Mixed} [data] The data to broadcast
   * @param {Function} [fn] The callback function
   * @return {Primus|Spark} this
   * @api public
   */

        function send(ev, data, fn) {
          /* jshint validthis: true */
          // ignore newListener event to avoid this error in node 0.8
          // https://github.com/cayasso/primus-emitter/issues/3
          if (/^(newListener|removeListener)/.test(ev)) return this;
          this.emitter.send.apply(this.emitter, arguments);
          return this;
        }
      }
      function emitter() {
        const { toString } = Object.prototype;
        const { slice } = Array.prototype;

        /**
   * Check if the given `value` is an `Array`.
   *
   * @param {*} value The value to check
   * @return {Boolean}
   */

        const isArray = Array.isArray || function isArray(value) {
          return toString.call(value) === '[object Array]';
        };

        /**
   * Event packets.
   */

        const packets = {
          EVENT: 0,
          ACK: 1,
        };

        /**
   * Initialize a new `Emitter`.
   *
   * @param {Primus|Spark} conn
   * @return {Emitter} `Emitter` instance
   * @api public
   */

        function Emitter(conn) {
          if (!(this instanceof Emitter)) return new Emitter(conn);
          this.ids = 1;
          this.acks = {};
          this.conn = conn;
          if (this.conn) this.bind();
        }

        /**
   * Bind `Emitter` events.
   *
   * @return {Emitter} self
   * @api private
   */

        Emitter.prototype.bind = function bind() {
          const em = this;
          this.conn.on('data', function ondata(packet) {
            em.ondata.call(em, packet);
          });
          return this;
        };

        /**
   * Called with incoming transport data.
   *
   * @param {Object} packet
   * @return {Emitter} self
   * @api private
   */

        Emitter.prototype.ondata = function ondata(packet) {
          if (!isArray(packet.data) || packet.id && typeof packet.id !== 'number') {
            return this;
          }
          switch (packet.type) {
          case packets.EVENT:
            this.onevent(packet);
            break;
          case packets.ACK:
            this.onack(packet);
          }
          return this;
        };

        /**
   * Send a message to client.
   *
   * @return {Emitter} self
   * @api public
   */

        Emitter.prototype.send = function send() {
          const args = slice.call(arguments);
          this.conn.write(this.packet(args));
          return this;
        };

        /**
   * Prepare packet for emitting.
   *
   * @param {Array} arguments
   * @return {Object} packet
   * @api private
   */

        Emitter.prototype.packet = function pack(args) {
          const packet = { type: packets.EVENT, data: args };
          // access last argument to see if it's an ACK callback
          if (typeof args[args.length - 1] === 'function') {
            const id = this.ids++;
            this.acks[id] = args.pop();
            packet.id = id;
          }
          return packet;
        };

        /**
   * Called upon event packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

        Emitter.prototype.onevent = function onevent(packet) {
          const args = packet.data;
          if (this.conn.reserved(args[0])) return this;
          if (packet.id) args.push(this.ack(packet.id));
          this.conn.emit.apply(this.conn, args);
          return this;
        };

        /**
   * Produces an ack callback to emit with an event.
   *
   * @param {Number} packet id
   * @return {Function}
   * @api private
   */

        Emitter.prototype.ack = function ack(id) {
          const { conn } = this;
          let sent = false;
          return function () {
            if (sent) return; // prevent double callbacks
            sent = true;
            conn.write({
              id,
              type: packets.ACK,
              data: slice.call(arguments),
            });
          };
        };

        /**
   * Called upon ack packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

        Emitter.prototype.onack = function onack(packet) {
          const ack = this.acks[packet.id];
          if (typeof ack === 'function') {
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
          }
          return this;
        };

        // Expose packets
        Emitter.packets = packets;

        return Emitter;
      }
      if (undefined === Primus) return;
      Primus.$ = Primus.$ || {};
      Primus.$.emitter = {};
      Primus.$.emitter.spark = spark;
      Primus.$.emitter.emitter = emitter;
      spark(Primus, emitter());
    }(Primus));
  },
]));
