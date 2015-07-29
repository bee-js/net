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

let request = net.Request('post', '/users')
                 .setHeader('Auth-Token', 'xxx-secret')
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

FormData can be used too:

```js
let form = document.getElementById('user-form');
let data = new FormData(form);
let request = net.Request('post', '/users')
                 .setHeader('Auth-Token', 'xxx-secret')
                 .set(data)
                 .send()
```

### Result object

```js
result.status; //=> 200
result.statusType; //=> 'success'

result.info; //=> false
result.success; //=> true
result.redirect; //=> false
```

Other usage examples will be added soon. See `test/specs` now.
