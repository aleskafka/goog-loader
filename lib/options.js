
var path = require('path');
var resolve = require('resolve');
var extend = require('deep-extend');


var _closureLibrary = resolve.sync('google-closure-library', { basedir: __dirname });
_closureLibrary = path.resolve(_closureLibrary, '../../../..');

var options = {
	_closureLibrary: _closureLibrary,
	_basePath: path.join(_closureLibrary, 'closure/goog/base.js'),
	compiler: {
	  compilation_level: 'ADVANCED',
	  define: [
	    'goog.DEBUG=false',
	    'goog.dom.ASSUME_STANDARDS_MODE=true',
	  ],
	  only_closure_dependencies: true,
	  warning_level: 'QUIET'
	}
};

module.exports = options;

module.exports.extend = function(_options) {
	extend(options, _options);

	if (!Array.isArray(options.js)) {
		options.js = [options.js];
	}

	options.globs = options.js.map(function(dir) {
		return dir + '/**/*.js';
	});

	if (options.closureLibrary===true) {
		options.closureLibrary = options._closureLibrary;
	}

	if (options.closureLibrary) {
		options._basePath = path.join(options.closureLibrary, 'closure/goog/base.js')
	}
}
