# bee-net

AJAX library

## Requirements

May require polyfills for:

- `Promise`
- `xhr2`
- `Object.assign`
- `Array.isArray`

## Usage

```js
import net from 'net.js';

let request = new net.Request('post', '/users/{id}')
                 .setHeader('Auth-Token', 'xxx-secret')
                 .set('id', 42)
                 .set('name', 'John Doe')
                 .set('email', 'john@example.org')
                 .type('json')
                 .send()

request.then(function(response) {
  let notification = document.getElementById('notification'),
      cssClass = response.success ? 'success' : 'failure';

  notification.innerText = response.json.message;
  notification.classList.add(cssClass);
  notification.classList.remove('hidden');
});
```

### Configuration

#### Promise

net uses native promise by default. You can change this by:

```js
import Bluebird from 'vendor/bluebird';

net.Promise = Bluebird;
```

#### Handlers

Handlers allows you to register a type, automatically serialize/deserialize data and make a shortcut for setting Content-Type

```js
net.setHandler('urlencoded', {
  contentTypes: ['application/x-www-form-urlencoded'],
  getter: QueryString.parse,
  setter: QueryString.stringify
});

net.setHandler('text', 'text/plain');

net.setHandler({
  name: 'text',
  contentTypes: ['text/plain'],
  getter: String.prototype.trim
});
```

### Request builder

#### Constructor

```js
new net.Request(method, url, options);
```

Where:

- **method** can be `GET`, `HEAD`, `POST`, `PUT`, `OPTIONS`, `DELETE` or other valid http verb
- **url** request url, can be relative or absolute (if CORS supported by browser)
- **options** request options:
  - **async** set this option to `false` if you want to perform synchronous request (not recommended)
  - **timeout** request timeout, in milliseconds
  - **type** registered request type or content-type string
  - **responseType** expected response type, can be registered type or `arraybuffer`, `blob` or `document`

Example:

```js
let request = new net.Request('POST', '/users/', {
  timeout: 2000,
  type: 'json',
  responseType: 'json'
});
```

URL can contain simple template:

```js
let request = net.Request('get', '/news/{year}/{month}')
request.set('year', 2015);
request.set('month', 08);
request.send(); // GET /news/2015/08
```

Options can also be specified by corresponding methods documented below or `setOption()` method:

```js
request.setOption('timeout', 1000);
```

#### data

Data can be added as key and value pairs:

```js
request.set('name', 'Joe');
```

or an object with keys and values:

```js
request.set({name: 'Joe', age: 26});
```

please, note that url variables **will not be included** in request body or query string:

```js
let request = new Request('get', '/users/{id}');
request.set({ id: 2, filter: 'name' });
request.send(); // GET /users/2?filter=name
```

or just a plain string

```js
request.set('Hello server');
```

FormData can be used too:

```js
let form = document.getElementById('user-form');
let data = new FormData(form);

request.set(data);
```

building multipart request is simple: Blob, ArrayBuffer or File can be the part of data:

```js
request.set('name', 'Joe');
request.set('avatar', file);
```

#### headers

```js
request.setHeader('X-Requested-With', 'beejs-net');
```

#### async

If you *really* wants to make async request:

```js
request.async(false);
```

#### timeout

The number of milliseconds a request can take before automatically being terminated

```js
request.timeout(2000);
```

#### type

Registered request type or content type. If type have setter, the data will be serialized by setter function.

```js
request.type('json');
request.type('application/json'); // Data will not be serialized
```

#### expect

The same as `responseType` option:

```js
request.expect('json');
```

note, that in this case, response Content-Type will be ignored.

### Response object

When request is successful (no network errors), it resolves promise with response object:

```js
request.then(function(response) {
  console.log(response);
});
```

It incapsulates the original XMLHTTPRequest and request objects:

```js
response.xhr;
response.request;
```

and contains some useful information like:

#### status

Lets say we received a 200 OK response from server:

```js
response.status; //=> 200
response.statusType; //=> 'success'
response.statusText; //=> 'OK'
```

also, some sugar available

```js
response.info; //=> false
response.success; //=> true
response.redirect; //=> false
response.clientError; //=> false
response.serverError; //=> false

response.error; //=> false
```

the same for 404:

```js
response.status; //=> 404
response.statusType; //=> 'clientError'
response.statusText; //=> 'Not Found'

response.success; //=> false
response.clientError; //=> true
response.serverError; //=> false

response.error; //=> true
```

#### data

Response body can be accessed as raw string:

```js
response.text; //=> 'Hello from server'
```

If response headers contains content type, which registered by `.setHandler` function ('application/json' and 'application/x-www-form-urlencoded' works out of box)
the body will be parsed and can be accessed by handler name:

```js
response.text; //=> '{ "id": 1, "name": "Joe" }'
response.body; //=> { id: 1, name: "Joe" }
response.json; //=> { id: 1, name: "Joe" }

response.json.id; //=> 1
response.type: //=> 'json'
```

#### headers

Headers can be accessed as object or with function. The second way is case-insensitive:

```js
response.headers['Content-Type']; //=> 'application/json'
response.getHeader('Content-Type'); //=> 'application/json'
response.getHeader('content-type'); //=> 'application/json'
```

shortcut for `Content-Type` header:

```js
response.contentType; //=> 'application/json'
// if registered:
response.type; //=> 'json'
```

## Development and build

```
npm install -g gulp
npm install
gulp test
gulp build
```
