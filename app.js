var express = require('express'),
	livereload = require('livereload'),
	path = require('path'),
	fs = require('fs'),
	favicon = require('serve-favicon'),
	config = require('./config.default.json');

try {
	customConfig = require('./config.json');
	Object.keys(customConfig).forEach(function(k) {
		config[k] = customConfig[k];
	});
}
catch(e) { console.log('Using default config file only'); }

var app = express(),
	livereloadServer = livereload.createServer({
		port: config.livereloadPort,
		exts: ['css', 'js'],
		interval: 100
	});

livereloadServer.watch(__dirname + '/public');

app.set('view engine', 'jade');
// allows absolute path in extends for jade
app.locals.basedir = app.get('views');
app.use(favicon(__dirname + '/assets/favicon.ico'));
app.use('/assets', express.static(__dirname + '/public'));
app.use('/assets/static', express.static(__dirname + '/assets/static'));
app.use('/assets/fonts', express.static(__dirname + '/assets/fonts'));

/**
 * Lookups all data files and merges them into one object.
 * @param {String} path request path
 * @param {Function} after callback to call after data is collected; data passes as parameter
 */
function lookupData(path, after) {
	path = (path && path != 'home') ? path.split('/') : [];
	if (path[0] == 'home') path.shift();

	// concatenate path segments
	path = path.map(function(el) {
		this.prefix += '/' + el;
		return this.prefix;
	}, { prefix: '' });

	// always fetch home data
	path.unshift('/home');

	data = {};

	// function checks data file existance, merges data and
	// calls itself again until path array exhausted
	(function next() {
		if (!path.length) return after(data);
		var file = './data' + path.shift();
		fs.exists(file +'.js', function(exists) {
			if (exists) {
				var fileData = require(file);
				delete require.cache[require.resolve(file)];
				Object.keys(fileData).forEach(function(k) {
					data[k] = fileData[k];
				});
			}
			next();
		});
	})();
}

function range(from, to) {
	if (!to){
		to = from;
		from = 0;
	}
	to = Math.ceil(to);
	from = Math.ceil(from);
	var a = [];
	while (from++ < to) a.push(from);
	return a;
}

function static(path) {
	return '/assets/static/' + path;
}

app.get(/^\/(.*)$/, function(req, res) {
	var reqPath = req.params[0];
	if (reqPath === '') reqPath = 'home';

	lookupData(reqPath, function(data) {
		data.__livereload = '//' + req.hostname + ':' + config.livereloadPort + '/livereload.js';
		data.__css = '/assets/main.css';
		data.__js = '/assets/main.js';
		data.req = req;
		data.static = static;
		data.range = range;
		try {
			res.render(reqPath, data, function(err, output) {
				if (err) res.status(404).end(err.toString());
				else res.end(output);
			});
		}
		catch (e) {
			res.status(404).end('Not found');
		}
	});
});

app.listen(config.appPort);
