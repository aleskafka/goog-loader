
var fs = require('fs');
var path = require('path');
var options = require('./index').options;
var extract = require('./lib/extract');
var clone = require('./lib/clone');

var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');
var through = require('through');

module.exports = function(source, map) {
	this.callback(null, source, map);
}

module.exports.pitch = function(source, map) {
	this.cacheable(true);

	var deps = extract(fs.readFileSync(this.resourcePath, 'utf-8'));

	if (deps && deps.provides.length) {
		var callback = this.async();
		var opt = clone(options.compiler);
		var flags = opt.compilerFlags = opt.compilerFlags || {};

		opt.fileName = path.basename(this.resourcePath);

		flags.closure_entry_point = deps.provides[0];
		flags.generate_exports = true;
		flags.only_closure_dependencies = true;
		flags.output_wrapper = "module.exports = (function(){%output% return "+options.globalObj+"['imports']}).apply("+options.globalObj+");"

		gulp.src([options.closureLibrary + '/**/*.js'].concat(options.js.length ? options.js : [options.js])).
			pipe(closureCompiler(opt)).
			pipe(through(function(file) {
				callback(null, file.contents.toString(), map);
			}));

	} else {
		this.emitWarning("File '"+this.resourcePath+"' does not provide namespace.");
		this.callback(null, ' ', map);
	}
}