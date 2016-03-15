
var fs = require('fs');
var path = require('path');
var options = require('./index').options;
var extract = require('./lib/extract');
var clone = require('./lib/clone');
var format = require('./lib/format');

var gulp = require('gulp');
var closureCompiler = require('google-closure-compiler').gulp();
var compileExports = require('./lib/exports');
var through2 = require('through2');

module.exports = function(source, map) {
	this.callback(null, source, map);
}

module.exports.pitch = function(source, map) {
	this.cacheable(true);

	var deps = extract(fs.readFileSync(this.resourcePath, 'utf-8'));

	if (deps && deps.provides.length) {
		var callback = this.async();
		var flags = clone(options.compiler);

		flags.closure_entry_point = deps.provides[0];
		flags.generate_exports = true;
		flags.only_closure_dependencies = true;
		flags.output_wrapper = "module.exports = (function(){%output% return _closure."+format.namespace(deps.provides[0])+";}).apply("+options.globalObj+");"

		var js = Array.isArray(options.js) ? options.js : [options.js];

		if (options.closureLibrary) {
			js = js.concat([options.closureLibrary + '/**/*.js']);
		}

		gulp.src(js).
			pipe(compileExports(options.js)).
			pipe(closureCompiler(flags)).
			pipe(through2.obj(function(file) {
				callback(null, file.contents.toString(), map);
			}));

	} else {
		this.emitWarning("File '"+this.resourcePath+"' does not provide namespace.");
		this.callback(null, ' ', map);
	}
}
