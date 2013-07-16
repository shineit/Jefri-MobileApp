
//convenience server for dev in a browser

connect = require('connect')

server = connect.createServer(
  connect.logger()
  , connect.static(__dirname)
).listen(8002);
console.log( "Listening on 8002");

