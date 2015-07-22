'use strict';

let net = {},
    win = window,
    contentTypeHandlers = {},
    contentTypes = {},
    getXhr;

const responseTypes = {
  'arraybuffer': true,
  'blob':        true,
  'document':    true,
  'text':        true
}

const statusTypes = [null, 'info', 'success', 'redirect', 'clientError', 'serverError'];

const lineEndReg = /\r?\n/;

function isObject(obj) { return obj === Object(obj); }

net.Promise = ('Promise' in win) ? win.Promise : null;
net.defaultOptions = {
  async: true,
  type: 'urlencoded'
};

net.serializeObject = function(obj) {
  if (!isObject(obj)) return obj;

  let pairs = [];
  for (let key in obj) {
    let value = (obj[key] == void 0) ? true : obj[key];
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return pairs.join('&');
}

/**
 * Add custom contentType handler
 *
 *     net.setHandler('application/x-www-form-urlencoded', {
 *       name: 'urlencoded',
 *       getter: QueryString.parse,
 *       setter: QueryString.stringify
 *     });
 *
 *     net.setHandler('text/plain', 'text');
 *
 *     net.setHandler({
 *       name: 'text',
 *       getter: String.prototype.trim
 *     });
 */
net.setHandler = function(name, options) {
  var opts = {}

  if (typeof(options) == 'string') {
    opts.contentTypes = [options];
  } else if(Array.isArray(options)) {
    opts.contentTypes = options;
  }

  if (isObject(name)) {
    Object.assign(opts, name);
  } else {
    opts.name = name;
    Object.assign(opts, options);
  }

  opts.contentTypes.forEach(ct => { contentTypes[ct] = name; })

  contentTypeHandlers[name] = opts;

  return name;
};

net.setHandler('html', 'text/html');
net.setHandler('urlencoded', {
  contentTypes: ['application/x-www-form-urlencoded'],
  setter: net.serializeObject
});

net.setHandler('json', {
  contentTypes: ['application/json'],
  getter: JSON.parse, // IE 10-11 does not supports responseType JSON
  setter: JSON.stringify
});

/**
 * Response object
 */
function Response(xhr, request) {
  let status       = xhr.status,
      contentType  = xhr.getResponseHeader('Content-Type'),
      responseText = xhr.responseText;

  // IE9 fix http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) status = 204;

  contentType = (contentType || '').split(';')[0];

  // Create stubs for responses
  this.info        = false;
  this.success     = false;
  this.redirect    = false;
  this.clientError = false;
  this.serverError = false;

  // Inject origins
  this.xhr     = xhr;
  this.request = request;

  // Set status props
  this.status     = status;
  this.statusType = statusTypes[status / 100 | 0];
  this.statusText = xhr.statusText;
  this[this.statusType] = true;

  this.error = this.clientError || this.serverError;

  // Set headers props
  this._parseHeaders(xhr.getAllResponseHeaders());
  this.contentType = contentType;
  this.type = contentTypes[contentType];

  // Set body props
  this.text = responseText;

  if (xhr.responseType != '' && responseTypes[xhr.responseType]) {
    this[xhr.responseType] = this.body = xhr.response; // TODO: XML response
  } else this._parseResponseBody();
}

Response.prototype = {
  getHeader: function(key) {
    return this._headers[key.toLowerCase()];
  },

  _parseHeaders: function(data) {
    let headers  = data.split(lineEndReg),
        result   = {},
        downcase = {},
        l = headers.length - 1,
        i = 0;

    headers.pop();

    while(i < l) {
      let header = headers[i++],
          parts  = header.split(':'),
          key    = parts.shift(),
          value  = parts.join(':').trim();

      result[key] = value;
      downcase[key.toLowerCase()] = value;
    }

    this.headers  = result;
    this._headers = downcase;
  },

  _parseResponseBody: function() {
    let type    = contentTypes[this.contentType],
        handler = contentTypeHandlers[this.type],
        body    = this.text;

    if (type && handler && handler.getter) {
      try {
        this[type] = this.body = handler.getter.call(body, body);
      } catch(e) {
        this.body = body;
      }
    } else {
      this.body = body;
    }
  }
};

function Request(type, url, options) {
  this.method  = type.toUpperCase();
  this.path    = url;
  this.data    = {};
  this.form    = null;
  this.options = Object.create(net.defaultOptions);
  this.headers = {};
}

Request.prototype = {
  set: function(key, value) {
    if (key instanceof FormData) { // TODO: File, Blob, ArrayBuffer
      this.form = key;
    } else if (value === void 0) {
      if (isObject(key)) {
        Object.assign(this.data, key);
      } else this.data[key] = true;
    } else this.data[key] = value;

    return this;
  },

  setHeader: function(key, value) {
    if (value === void 0 && isObject(key)) {
      Object.assign(this.headers, key);
    } else this.headers[key] = value;

    return this;
  },

  setOption: function(opt, val) {
    this.options[opt] = val;
    return this;
  },

  async: function(val) {
    return this.setOption('async', val);
  },

  timeout: function(val) {
    return this.setOption('timeout', val);
  },

  type: function(val) {
    return this.setOption('type', val);
  },

  send: function() {
    let xhr = new win.XMLHttpRequest(),
        self = this,
        type = self.options.type,
        url  = self.path,
        responseType = self.options.responseType,
        handler = contentTypeHandlers[type],
        headers = Object.create(self.headers),
        data;

    if (Object.keys(self.data).length > 0 || self.form) {
      if (self.method === 'GET') {
        data = null;
        let query = net.serializeObject(self.data);
        if (query !== '') url += ~url.indexOf('?') ? '&' + query : '?' + query;
      } else if (self.form) {
        data = self.form;
        for (let key in self.data) data.append(key, data);
      } else if (handler && handler.setter) {
        data = handler.setter.call(self.data, self.data);
        if (!('Content-Type' in headers)) headers['Content-Type'] = handler.contentTypes[0];
      } else data = self.data;
    }

    xhr.open(self.method, url, self.options.async);

    if (responseType && responseTypes[responseType]) {
      xhr.responseType = responseType;
    }

    for (let header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }

    return new net.Promise(function(resolve, reject) {
      xhr.addEventListener('load', function() {
        let response = new Response(xhr, self);

        resolve(response);
      });

      xhr.addEventListener('error', ()=>{ reject(xhr) });

      if (self.options.timeout) {
        xhr.timeout = self.options.timeout;

        xhr.addEventListener('timeout', ()=>{ reject(xhr) });
      }

      xhr.send(data);
    });
  }
};

net.Request  = Request;
net.Response = Response;

export default net;
