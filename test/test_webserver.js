var connect = require('connect'),
    serveStatic = require('serve-static');

console.log(__dirname);

var app = connect();

app.use(serveStatic(__dirname+"/../dev"));
app.use(serveStatic(__dirname+"/../test"));

app.use(function(req, res, next){
  res.setHeader("X-My-custom-header", ":{D");
  next()
});

module.exports = app;
if (!module.parent) {
  var server = app.listen(3001, 'localhost', function(){
		var host = server.address().address
	  	var port = server.address().port
		console.log("Test app listening at http://%s:%s", host, port)
	});
}
