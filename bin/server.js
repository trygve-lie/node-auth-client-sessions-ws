
// Inspired by: https://hacks.mozilla.org/2012/12/using-secure-client-side-sessions-to-build-simple-and-scalable-node-js-applications-a-node-js-holiday-season-part-3/



/*
  TODO: Terminate WebSocket connection of http logout!
*/


var http              = require('http'),
    express           = require('express'),
    clientSessions    = require('../../lib/client-sessions'),
    WebSocketServer   = require('ws').Server,
    app               = express(),

    port              = process.argv[2] ? process.argv[2] : 8000,
    docRoot           = './public',

    cookieConfig      = {
      secret: 'insaneLongAndCrypticString'
    };


function httpAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    console.info(+new Date(), 'Authentication ok');
    return next();
  }
  console.info(+new Date(), 'Authentication failed');
  res.json({auth:0});
}



function wsAuthenticated(result) {
  var decoded       = '',
      authorized    = false;

  if (result.req.headers.cookie) {
    decoded = clientSessions.util.decode(cookieConfig, result.req.headers.cookie.split('=')[1]);

    if (decoded.content.isAuthenticated) {
      authorized = decoded.content.isAuthenticated;
    }
  }

  return authorized;
}



app.configure(function() {
  app.use(clientSessions(cookieConfig));
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(docRoot));
});


app.post('/login', function(req, res){
  var username = req.param('username', null),
      password = req.param('password', null);

  if (username === 'test' && password === 'test') {
    req.session.isAuthenticated = true;
    req.session.name = 'John Doe';
    res.json({auth:1, name : req.session.name});
    console.info(+new Date(), 'Login ok');

  } else {
    res.json({auth:-1});
    console.info(+new Date(), 'Login failed');

  }
});


app.get('/logout', function(req, res) {
  req.session.reset();
  res.json({auth:0});
  console.info(+new Date(), 'Logout');
});


app.get('/userinfo', httpAuthenticated, function(req, res) {
  res.json({auth:1, name : req.session.name});
});


app.get('/stats', httpAuthenticated, function(req, res) {
  res.json({
    node  : process.versions.node,
    v8    : process.versions.v8,
    os    : process.platform,
    arch  : process.arch
  });
});


var httpServer = http.createServer(app);



var wsServer = new WebSocketServer({
  server:  httpServer,
  path : '/stream',
  disableHixie : true,
  verifyClient: wsAuthenticated
});


wsServer.on('connection', function(ws) {
  console.info(+new Date(), 'WebSocket connection established');

  var id = setInterval(function() {
    ws.send(JSON.stringify(process.memoryUsage()));
    // ws.close();
  }, 100);

  ws.on('close', function() {
    clearInterval(id);
  })

});

// Start server
httpServer.listen(port);
console.info(+new Date(), 'Server running at http://localhost:' + port + '/');


// Prevent exceptions to bubble up to the top and eventually kill the server
process.on("uncaughtException", function (err) {
    console.warn(err.stack);
});