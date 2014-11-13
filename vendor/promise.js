define(function() {
  'use strict';

  var uid = 1,
      glob = typeof(global) != 'undefined' ? global : window,
      enqueue, PENDING, FULFILLED, REJECTED;

  // Dummy version of setImmediate polyfill
  if ('setImmediate' in glob && typeof(glob.setImmediate == 'function')) {
    enqueue = glob.setImmediate;
  } else if (typeof(process) == 'object' && process.nextTick) {
    enqueue = process.nextTick;
  } else {
    enqueue = function(fn) { setTimeout(fn, 0); }; // TODO: consider use postmessage or message channel or image onload instead
  }

  /**
   * Create new deferred object
   *
   * @class
   * @private
   *
   * @params {Promise} [promise]
   */
  function Deferred(promise) {
    this.promise = promise || new Promise();

    this._handlers = {
      fulfilled: [],
      rejected:  [],
      progress:  [],
      anyway:    []
    };
  }

  Deferred.prototype = {
    /**
     * Fulfill promise with given `value`
     *
     * @param value Fulfillment value
     */
    fulfill: function(value) {
      if (this.promise.state === PENDING) {
        this.promise.value = value;
        dispatch(this, FULFILLED, this.promise.value);
        this._handlers[REJECTED] = null;
      }

      return this;
    },

    /**
     * Reject promise with given `reason`
     *
     * @param reason Reason of rejection
     */
    reject: function(reason) {
      if (this.promise.state === PENDING) {
        this.promise.reason = reason;
        dispatch(this, REJECTED, this.promise.reason);
        this._handlers[FULFILLED] = null;
      }

      return this;
    },

    /**
     * Add fulfillment callback
     *
     * @param {Function} callback Fulfillment callback
     */
    success: function(callback) {
      if (callback && this.promise.state === PENDING) {
        this._handlers[FULFILLED].push(callback);
      }

      if (this.promise.state === FULFILLED) {
        var value = this.promise.value;

        enqueue(function() {
          callback(value);
        });
      }

      return this;
    },

    /**
     * Add rejection callback
     *
     * @param {Function} callback Rejection callback
     */
    fail: function(callback) {
      if (callback && this.promise.state === PENDING) {
        this._handlers[REJECTED].push(callback);
      }

      if (this.promise.state === REJECTED) {
        var reason = this.promise.reason;

        enqueue(function() {
          callback(reason);
        });
      }

      return this;
    },

    /**
     * Promise A+ 1.1 resolving chain process. Resolves promise relying
     * on given parent promise state.
     *
     * @param x Parent promise
     */
    resolve: function(x) {
      var self = this;

      if (!!x && (typeof(x) == 'function' || typeof(x) == 'object')) { // 2.3.3
        x = assimilate(this, x);
      }

      if (x instanceof Promise) { // 2.3.2 - value is trusted promise
        if (x.isPending()) { // 2.3.2.1 - wait until x is fulfilled or rejected
          x.deferred.success(function(v) { self.fulfill(v); });
          x.deferred.fail(function(r) { self.reject(r);  });
        }
        if (x.isFulfilled()) this.fulfill(x.value); // 2.3.2.2
        if (x.isRejected())  this.reject(x.reason); // 2.3.2.3
      } else this.fulfill(x); // 2.3.4
    }
  };

  /**
   * Dispatch state corresponding callbacks
   *
   * @private
   *
   * @param {Deferred} deferred Deferred object which should be dispatched
   * @param {String}   state    Target state: fulfilled or rejected
   * @param            value    Fulfillment value or rejection reason
   */
  function dispatch(deferred, state, value) {
    var handlers = deferred._handlers[state],
        handler;

    deferred.promise.state = state;

    enqueue(function() {
      /*jshint boss:true */
      while(handler = handlers.shift()) {
        handler(value); // 2.2.5
      }
    });
  }

  /**
   * Promise A+ 1.1 assimilation.
   *
   * @private
   *
   * @param {Deferred} dfd Target deferred object
   * @param            x   Promise which will be assimilated
   */
  function assimilate(dfd, x) {
    if (x === dfd.promise) { // 2.3.1 - promise and value are the same object
      dfd.reject(new TypeError('Promise can not resolve itself'));
    }

    var then;

    try {
      then = x.then; // 2.3.3.1
    } catch (e) {
      dfd.reject(e); // 2.3.3.2
    }

    // 2.3.3.3
    if (typeof(then) == 'function') {
      return new Promise(function(resolve, reject) {
        var callbackCalled = false;

        try {
          then.call(x,
            function(y) { // resolve
              if (!callbackCalled) { // 2.3.3.3.3
                callbackCalled = true;
                resolve(y);
              }
            },
            function(r) { // reject
              if (!callbackCalled) {
                callbackCalled = true;
                reject(r);
              }
            });
        } catch (e) { // 2.3.3.3.4
          if (!callbackCalled) { dfd.reject(e); } // 2.3.3.3.4.2
        }
      });
    } else {
      return x; // 2.3.3.4
    }
  }

  /**
   * Create a new promise
   *
   * @class
   * @params {Function} async resolver <Function resolve, Function reject>
   */
  function Promise(resolver) {
    var deferred = new Deferred(this);

    this.uid = uid++;

    this.state    = PENDING;
    this.deferred = deferred;

    this.value  = void 0;
    this.reason = void 0;

    if (typeof(resolver) == 'function') {
      resolver.call(this,
        function(value) { deferred.resolve(value); },
        function(value) { deferred.reject(value);  }
      );
    }
  }

  // Allowed promise states
  Promise.PENDING   = PENDING   = 'pending';
  Promise.FULFILLED = FULFILLED = 'fulfilled';
  Promise.REJECTED  = REJECTED  = 'rejected';

  Promise.prototype = {

    /**
     * Promises A+ `then`. Returns new chained promise which
     * will be resolved with `onFulfilled` handler or
     * rejected with `onRejected` handler
     *
     *     var promise = new Promise(calculateSomethingAsync);
     *
     *     promise.then(function(val) {
     *       console.log('Result is: ' + val);
     *     }, function(error) {
     *       console.warn('Something bad happened: ' + error);
     *     });
     *
     * @param {Function} [onFulfilled] Fulfillment handler
     * @param {Function} [onRejected]  Rejection handler
     *
     * @returns {Promise}
     */
    then: function(onFulfilled, onRejected) {
      var promise     = Promise.pending(),
          oldDeferred = this.deferred,
          newDeferred = promise.deferred;

      if (typeof(onFulfilled) == 'function') {
        oldDeferred.success(thenCallback(newDeferred, onFulfilled));
      } else {
        oldDeferred.success(function(v) {
          newDeferred.fulfill(v);
        });
      }

      if (typeof(onRejected) == 'function') {
        oldDeferred.fail(thenCallback(newDeferred, onRejected));
      } else {
        oldDeferred.fail(function(v) {
          newDeferred.reject(v);
        });
      }

      return promise;
    },

    /**
     * Return a promise which will be fulfilled with
     * an array of results
     *
     *     new Promise(function(fulfill) {
     *       fulfill([1, another_promise(2), 3]);
     *     }).all().then(function(values) {
     *       console.log(values); //=> [1, 2, 3]
     *     });
     *
     * @returns {Array}
     */
    all: function() {
      return this.then(Promise.all);
    },

    /**
     * Map an array of a promises or values with
     * given `iterator` function.
     *
     *     var arr = [1, another_promise(2), 3];
     *
     *     new Promise(function(fulfill) {
     *       fulfill([1, another_promise(2), 3]);
     *     }).map(arr, function(value, index, array) {
     *       return value * 2;
     *     }).then(function(values) {
     *       console.log(values); //=> [2, 4, 6]
     *     });
     *
     * @param {Function} iterator Map function <value, index, originalArray>
     *
     * @returns {Promise}
     */
    map: function(iterator) {
      return this.then(function(values) {
        return Promise.map(values, iterator);
      });
    },

    /**
     * Check if promise is pending
     *
     * @returns {Boolean}
     */
    isPending: function() {
      return this.state === PENDING;
    },

    /**
     * Check if promise was fullfilled
     *
     * @returns {Boolean}
     */
    isFulfilled: function() {
      return this.state === FULFILLED;
    },

    /**
     * Check if promise was rejected
     *
     * @returns {Boolean}
     */
    isRejected: function() {
      return this.state === REJECTED;
    },

    /**
     * Return promise value if fulfilled
     * or reason if rejected
     */
    result: function() {
      return this.state === REJECTED ? this.reason : this.value;
    }
  };

  /**
   * Create new, pended promise
   *
   * @returns {Promise}
   */
  Promise.pending = function() {
    return new Promise();
  };

  /**
   * Create new promise fulfilled with `value`
   *
   * @param [value] Value to be fulfilled with
   *
   * @returns {Promise}
   */
  Promise.fulfilled = Promise.resolved = function(value) {
    var deferred = (new Promise()).deferred;

    deferred.fulfill(value);

    return deferred.promise;
  };

  /**
   * Create already rejected promise
   *
   * @param [reason] Rejection reason
   *
   * @returns {Promise}
   */
  Promise.rejected = function(reason) {
    var deferred = (new Promise()).deferred;

    deferred.reject(reason);

    return deferred.promise;
  };

  /**
   * Create deferred object
   *
   * @returns {Deferred}
   */
  Promise.deferred = function() {
    return (new Promise()).deferred;
  };

  /**
   * Check if given object is trusted promise
   *
   * @param obj Object to check
   *
   * @returns {Boolean}
   */
  Promise.isPromise = function(obj) {
    return obj instanceof Promise;
  };

  /**
   * Return true if given object quacks like promise
   *
   * @param obj Object to check
   *
   * @returns {Boolean}
   */
  Promise.isPromiseLike = function(obj) {
    return obj && typeof(obj.then) == 'function';
  };

  /**
   * Takes an array with promises and returns a promise
   * which will be fulfilled with an array of results
   *
   *     var promise1 = new Promise(function(resolve) { resolve(1); }),
   *         promise3 = new Promise(function(resolve) { resolve(3); }),
   *         promise  = new Promise.all([promise1, 'hello', promise3]);
   *
   *     promise.then(function(values) {
   *       console.log(values); //=> [1, 'hello', 3]
   *     });
   *
   * @param {Array} values List of promises or values or mixed
   *
   * @returns {Promise}
   */
  Promise.all = function(values) {
    return new Promise(function(resolve, reject) {
      var i = -1, len = values.length,
          results = new Array(len),
          pending = len;

      function resolver(value, index) {
        if (Promise.isPromiseLike(value)) {
          value.then(function(val) {
            resolver(val, index);
          }, reject);
        }
        results[index] = value;
        if(--pending === 0) resolve(results);
      }

      while (++i < len) resolver(values[i], i);

      if (pending === 0) resolve(results);
    });
  };

  /**
   * Map an array of a promises or values with
   * given `iterator` function.
   *
   *     var arr = [1, another_promise(2), 3];
   *
   *     Promise.map(arr, function(value, index, array) {
   *       console.log(array); //=> [1, 2, 3]
   *       return value * index;
   *     }).then(function(values) {
   *       console.log(values); //=> [0, 2, 6]
   *     });
   *
   * @param {Array}    values   Array of promises or values or mixed
   * @param {Function} iterator Map function <value, index, originalArray>
   *
   * @returns {Promise}
   */
  Promise.map = function(values, iterator) {
    return Promise.all(values).then(function(fulfillments) {
      var len    = fulfillments.length,
          result = new Array(len),
          i      = -1;

      while (++i < len) result[i] = iterator(fulfillments[i], i, fulfillments);

      return result;
    });
  };

  /**
   * Add `then` handlers
   *
   * @private
   *
   * @param {Deferred} dfd
   * @param {Function} callback
   */
  function thenCallback(dfd, callback) {
    var result = function(v) {
      var ret;

      try {
        ret = callback(v);
      } catch (e) {
        return dfd.reject(e);
      }

      dfd.resolve(ret);
    };

    result.origin = callback;

    return result;
  }

  return Promise;
});
