
var fs = require('fs');

var gulp = require('gulp');
var through2 = require('through2');
var closureCompiler = require('google-closure-compiler').gulp();

var compileExports = require('./lib/exports');
var options = require('./lib/options');
var extract = require('./lib/extract');
var clone = require('./lib/clone');

require('google-closure-compiler/lib/node/closure-compiler').JAR_PATH = __dirname + '/compiler.jar'
require('google-closure-compiler/lib/node/closure-compiler').COMPILER_PATH = __dirname + '/compiler.jar'


module.exports = function() {}
module.exports.pitch = function() {
	this.cacheable(true);

	var deps = extract(fs.readFileSync(this.resourcePath, 'utf-8'));

	if (deps && deps.modules.length) {
		var callback = this.async();
		var flags = clone(options.compiler);

		flags.closure_entry_point = deps.modules[0];
		flags.generate_exports = true;
		flags.only_closure_dependencies = true;
		flags.output_wrapper = "global.googNamespace = {}; \n (function() { %output% }).call(global); ";

		var globs = options.globs;

		if (options.closureLibrary) {
			globs = globs.concat([options.closureLibrary + '/**/*.js']);
		}

		gulp.src(globs).
			pipe(compileExports(options.globs)).
			pipe(closureCompiler(flags)).
			pipe(through2.obj(function(file) {
				callback(null, file.contents.toString());
			}));

	} else {
		this.emitWarning("Entry '"+this.resourcePath+"' does not export module.");
		this.callback(null, ' ');
	}
}
