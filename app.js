var express = require('express'),
	path = require('path'),
	fs = require('fs'),
	favicon = require('serve-favicon');

var app = express();

app.set('view engine', 'jade');
app.use(favicon(__dirname + '/assets/favicon.ico'));
app.use('/assets', express.static(__dirname + '/public'));

app.get(/^\/(.*)$/, function(req, res) {
	var reqPath = req.params[0];
	if (reqPath === '') reqPath = 'home';
	
	fs.exists('./data/' + reqPath + '.js', function(exists) {
		var data = {};
		if (exists) {
			data = require('./data/' + reqPath);
			delete require.cache[require.resolve('./data/' + reqPath)];
		}
		data.__livereload = '//' + req.hostname + ':35729/livereload.js';
		data.__css = '/assets/main.css';
		data.__js = '/assets/main.js';		
		res.render(reqPath, data, function(err, output) {
			if (err) {
				res.status(404).end(err.toString());
			}
			else {
				res.end(output);
			}
		});
	});
});

app.listen(3000);