
var options = require('./lib/options');
var dependencies = require('./lib/dependencies');

var loaderDevelopment = require('./lib/loader.development');
var loaderProduction = require('./lib/loader.production');

var cache = {};

module.exports = function(source, map) {
	this.cacheable(true);

	if (this.request.match(/\/goog-loader\/index\.js/g).length>1) {
		this.emitWarning('goog-loader is applied twice.\nPossible problem is with providing variable, fix with !!goog! as loader.');
	}

	if (cache[this.resourcePath] && cache[this.resourcePath].source===source) {
		return this.callback(null, cache[this.resourcePath].output, map);
	}

	var that = this;
	var resourcePath = this.resourcePath;
	var callback = this.async();
	var production = process.env.NODE_ENV==='production';
	var loader = production ? loaderProduction.bind(this) : loaderDevelopment.bind(this);

	options.js.forEach(this.addContextDependency.bind(this));

	dependencies.changed(resourcePath, cache[resourcePath]&&cache[resourcePath].error, function() {
		if (dependencies.isReachable(resourcePath)) {
			var request = "!!goog-loader/"
				+ (production ? "build" : "base")
				+ "!"
				+ (production ? options.entry : options._basePath);

			var output = "require(" + JSON.stringify(request) + ");\n"
				+ loader(source, map);

			cache[resourcePath] = {source: source, output: output, error: false};
			return callback(null, output, map);
		}

		cache[resourcePath] = {error: true};
		that.emitError('File ' + resourcePath + ' is not reachable from goog-loader entry point.');
		return callback(null, " ");
	});
}


module.exports.init = function(opt) {
	options.extend(opt);
	dependencies.init(options.closureLibrary);
}
