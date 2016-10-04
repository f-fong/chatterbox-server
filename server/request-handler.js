var fs = require('fs');
var path = require('path');
/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

// this is only a message data storage
var storage = [
  {
    username: 'Jono',
    message: 'Do my bidding!',
    roomname: 'Lobby'
  },
  {
    username: 'Mel Brooks',
    message: 'It\'s good to be the king',
    roomname: 'Lobby'
  }
];

var apiHandler = function(request, response, headers) {
  var statusCode = 200; // default status code

  var requestObject;
  var responseObject;
  var buffer = '';

  headers['Content-Type'] = 'application/json';
  if (request.method === 'GET') {
    // Response status code for GET is 200
    statusCode = 200;
    responseObject = { results: [] };
    // Pull storage data and send them to the requester
    if (storage.length > 0) {
      storage.forEach(function(data) {
        responseObject.results.push(data);
      });
    }
    response.writeHead(statusCode, headers);
    response.end(JSON.stringify(responseObject));
  } else if (request.method === 'POST') {
    // Response status code for POST is 201
    statusCode = 201;
    request.on('data', function(data) {
      buffer += data;
    });

    request.on('end', function() {
      requestObject = JSON.parse(buffer);
      storage.unshift(requestObject);
      response.writeHead(statusCode, headers);
      response.end(JSON.stringify(requestObject));
    });
  } else if (request.method === 'OPTIONS') {
    // Response status code for OPTIONS is 200
    statusCode = 200;
    response.writeHead(statusCode, headers);
    response.end();
  } else if (request.method === 'DELETE') {
    statusCode = 204;
    request.on('data', function(data) {
      buffer += data;
    });
    request.on('end', function() {
      requestObject = JSON.parse(buffer);

      var index = storage.findIndex(function(data) {
        return (data.username === requestObject.username && 
                data.message === requestObject.message && 
                data.roomname === requestObject.roomname);
      });

      // Remove the message 
      storage.splice(index, 1);
      response.writeHead(statusCode, headers);
      response.end();
    });
  }  
};

var fileRequestHandler = function(request, response) {
  if (request.method === 'GET') {
    var filePath = request.url;
    if (filePath === '/' || filePath.includes('/?username=')) {
      filePath = '/index.html';
    }

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;      
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    }

    var clientPath = path.join(__dirname, '../client');
    var fileLocation = clientPath + filePath;   
    fs.readFile(fileLocation, function(error, content) {
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    });
  }
};

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  var log = 'Serving request type ' + request.method + ' for url ' + request.url;
  
  var headers = defaultCorsHeaders;
  var responseObject;
  var requestObject;

  var clientResourceRoutes = [
    '/',
    '/styles/styles.css',
    '/bower_components/jquery/dist/jquery.js',
    '/bower_components/underscore/underscore.js',
    '/scripts/app.js',
    '/client/images/spiffygif_46x46.gif'
  ];
  
  // '/classes/messages' route goes to the apiHandler 
  if (request.url === '/classes/messages') {
    apiHandler(request, response, headers);
  } else if (clientResourceRoutes.indexOf(request.url) >= 0) { // handles the client side resources
    fileRequestHandler(request, response);
  } else if (request.url.includes('/?username=')) {
    fileRequestHandler(request, response);
  } else { // no matche routes will be invalid - return with status code 404
    response.writeHead(404, headers);
    response.end();
  }
};



exports.requestHandler = requestHandler;
