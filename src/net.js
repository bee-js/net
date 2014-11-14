define(['promise', 'querystring'], function(Promise, QueryString) {
  "use strict";

  var net = {},
      win = window,
      contentTypeHandlers = {},
      contentTypes = {},
      statusTypes = [null, 'info', 'success', 'redirect', 'clientError', 'serverError'],
      lineEndReg = /\r?\n/,
      getXhr;

  /**
   * Add custom contentType handler
   *
   *     net.setHandler("application/json", {
   *       name: "json",
   *       getter: JSON.parse,
   *       setter: JSON.stringify
   *     });
   *
   *     net.setHandler('text/plain', 'text');
   *
   *     net.setHandler({
   *       name: 'text',
   *       getter: String.prototype.trim
   *     });
   */
  net.setHandler = function(contentType, options) {
    var name;

    if (typeof(options) == 'string') {
      name = options;
    } else {
      name = options.name ? options.name : contentType;
    }

    if (options === void 0 && typeof(contentType) == 'object') {
      options = contentType;
    } else {
      contentTypes[contentType] = name;
    }

    if (typeof(options) == 'object') contentTypeHandlers[name] = options;

    return name;
  };

  net.setHandler('application/json', {
    name: 'json',
    getter: JSON.parse,
    setter: JSON.stringify
  });

  net.setHandler('application/x-www-form-urlencoded', {
    name: 'urlencoded',
    getter: QueryString.parse,
    setter: QueryString.stringify
  });

  /**
   * Response object
   */
  function Response(xhr, request) {
    var status       = xhr.status,
        contentType  = xhr.getResponseHeader('Content-Type'),
        responseText = xhr.responseText;

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
    parseHeaders(xhr.getAllResponseHeaders(), this);
    this.contentType = contentType;
    this.type = contentTypes[contentType];

    // Set body props
    this.text = responseText;
    parseResponseBody(responseText, contentType, this);
  }

  Response.prototype = {
    getHeader: function(key) {
      return this._headers[key.toLowerCase()];
    }
  };

  function Request(type, url, options) {
    this.type    = type.toUpperCase();
    this.path    = url;
    this.data    = {};
    this.headers = {};
  }

  Request.prototype = {
    send: function() {
      var xhr = new win.XMLHttpRequest();

      xhr.open(this.type, this.path, true);

      return new Promise(function(resolve, reject) {
        xhr.onload = function(ev) {
          var response = new Response(xhr, request);

          if (response.error) {
            reject(response);
          } else {
            resolve(response);
          }
        };
        xhr.send();
      });
    }
  };

  function parseHeaders(data, object) {
    var headers  = data.split(lineEndReg),
        result   = {},
        downcase = {},
        l = headers.length - 1,
        i = 0;

    headers.pop();

    while(i < l) {
      var header = headers[i++],
          parts  = header.split(':'),
          key    = parts.shift(),
          value  = parts.join(':').trim();

      result[key] = value;
      downcase[key.toLowerCase()] = value;
    }

    object.headers  = result;
    object._headers = downcase;

    return object;
  }

  function parseResponseBody(body, contentType, object) {
    var type    = contentTypes[contentType],
        handler = contentTypeHandlers[type];

    if (type && handler && handler.getter) {
      try {
        object[type] = object.body = handler.getter.call(body, body);
      } catch(e) {
        object.body = body;
      }
    } else {
      object.body = body;
    }

    return object;
  }

  net.Request  = Request;
  net.Response = Response;

  return net;
});
