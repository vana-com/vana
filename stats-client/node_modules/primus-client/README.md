# Primus-client

This is a prebuilt primus client-side library with default options. It does not come pre-minified as that is out of the scope of this project.

## Link to the full library

[https://www.npmjs.com/package/primus](https://www.npmjs.com/package/primus)

## Example client-side code

```javascript
// can be used with feathers (optional)
import feathers from '@feathersjs/feathers';
// can be used with feathers (optional)
import primusClient from '@feathersjs/primus-client';
import Primus from 'primus-client';
import set from 'lodash/set';

const protocol = `ws${location.protocol === 'https:' ? 's' : ''}:`;

const connectionString = `${protocol}//${location.hostname}`;

const socket = new Primus(connectionString, {
  protocol,
});

// can be used with feathers (optional)
const app = feathers();

// can be used with feathers (optional)
app.configure(primusClient(socket));

// you can add token for auth or other query params
socket.on('outgoing::url', function connectionURL(url) {
  set(url, 'query', `${url.query}&token=${token}`);
});

function executePrimusRequest(...args) {
  if (!args[2]) {
    set(args, 2, {});
  }

  socket.send(...args);
}

const data = {
  test: true,
};

// provides an optional callback to the request if you match the server response type and id like:
// spark.write({
//   type: 1,
//   data: [null, msg],
//   id,
// });
executePrimusRequest('someRequestType', data, (err, msg) => {});

// listen to custom server response messages like:
// spark.write({
//   type: 0,
//   data: ['someResponseType', msg],
// });
socket.on('someResponseType', (msg) => {});
```

## The following options are built-in (can NOT be changed):

Name                | Description                               | Default
--------------------|-------------------------------------------|---------------
authorization       | Authorization handler                     | `null`
pathname            | The URL namespace that Primus can own     | `/primus`
parser              | Message encoder for all communication     | `JSON`
transformer         | The transformer we should use internally  | `websockets`
plugin              | The plugins that should be applied        | `{}`
pingInterval        | Interval at which heartbeats are sent     | `30000`
global              | Set a custom client class / global name   | `Primus`
compression         | Use permessage-deflate / HTTP compression | `false`
maxLength           | Maximum allowed packet size, in bytes     | `10485760`
transport           | Transformer specific configuration        | `{}`
idGenerator         | Custom spark id generator function        | `undefined`
origins             | **cors** List of origins                  | `*`
methods             | **cors** List of accepted HTTP methods    | `GET,HEAD,PUT,POST,DELETE,OPTIONS`
credentials         | **cors** Allow sending of credentials     | `true`
maxAge              | **cors** Cache duration of CORS preflight | `30 days`
headers             | **cors** Allowed headers                  | `false`
exposed             | **cors** Headers exposed to the client    | `false`
