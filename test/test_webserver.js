var connect = require('connect'),
	https = require('https'),
	fs = require('fs'),
    serveStatic = require('serve-static');

var app = connect();

var https_page_options = {
    key:    fs.readFileSync('test/ssl/shared_cookie_test.com/server.key'),
    cert:   fs.readFileSync('test/ssl/shared_cookie_test.com/server.crt')
};
var https_iframe_options = {
    key:    fs.readFileSync('test/ssl/shared_cookie_iframe.com/server.key'),
    cert:   fs.readFileSync('test/ssl/shared_cookie_iframe.com/server.crt')
};

app.use(serveStatic(__dirname+"/../dev"));
app.use(serveStatic(__dirname+"/../test"));

module.exports = {
	startHttpApp: function(port){
		return app.listen(port, 'localhost' );
	},
	startHttpsApp: function(page_port, ifr_port){
		return {
			page_app: https.createServer(https_page_options, app).listen(page_port, 'localhost'),
			ifr_app: https.createServer(https_iframe_options, app).listen(ifr_port, 'localhost')
		}
	}
};

if (!module.parent) {
  	var http_server = app.listen(3001, 'localhost', function(){
		var host = http_server.address().address
	  	var port = http_server.address().port
		console.log("Test app (HTTP) listening at http://%s:%s", host, port)
	});
	var https_server = https.createServer(https_page_options,app).listen(3002, 'localhost', function(){
		var host = https_server.address().address
	  	var port = https_server.address().port
		console.log("Test app (HTTPS) listening at https://%s:%s", host, port)
	});
	var https_if_server = https.createServer(https_iframe_options,app).listen(3003, 'localhost', function(){
		var host = https_if_server.address().address
	  	var port = https_if_server.address().port
		console.log("Test iframe host (HTTPS) listening at https://%s:%s", host, port)
	});
}
