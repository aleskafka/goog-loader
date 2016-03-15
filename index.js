
var gulp = require('gulp');
var through = require('through');

var path = require('path');
var resolve = require('resolve');
var extend = require('deep-extend');

var clone = require('./lib/clone');
var loader = require('./lib/loader');
var changed = require('./lib/changed');
var depsline = require('./lib/depsline');

var cache = {};
var options = {
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

options._closureLibrary = resolve.sync('google-closure-library', { basedir: __dirname });
options._closureLibrary = path.resolve(options._closureLibrary, '../../../..');
options._basePath = path.join(options._closureLibrary, 'closure/goog/base.js')

module.exports = function(source, map) {
	this.cacheable(true);

	if (this.resourcePath.indexOf('/closure/goog/base.js')!==-1) {
		source = "global.goog = {};"
			 + "global.CLOSURE_NO_DEPS=true;"
			 + "(function() { "
			 + source.replace(/var goog = goog \|\| \{\};/, '')
			 + " }).call(global)";

		this.callback(null, source, map);

	} else if (changed(cache, this.resourcePath)) {
		var callback = this.async();

		loadDeps(function(source, map) {
			source = "require('goog!"+options._basePath+"'); " + loader(this, source);
			callback(null, source, map);
		}.bind(this, source, map));

	} else {
		source = "require('goog!"+options._basePath+"'); " + loader(this, source);
		this.callback(null, source, map);
	}
};

module.exports.options = options;
module.exports.loadDeps = loadDeps;
module.exports.init = init;

goog = {
	dependencies_: {
	  pathIsModule: {}, // 1 to 1
	  nameToPath: {}, // 1 to 1
	  requires: {}, // 1 to many
	  visited: {}, // Used when resolving dependencies to prevent us from visiting file twice.
	  written: {}, // Used to keep track of script files we have written.
	  deferred: {} // Used to track deferred module evaluations in old IEs
	},
	addDependency: function(relPath, provides, requires, opt_isModule) {
		if (relPath[0]!=='/') {
			if (!options.closureLibrary) {
				throw new Error('Missing Closure Library for ' + relPath + ' dependency.');
			}

			relPath = options.closureLibrary + '/closure/goog/' + relPath;
		}

	    var provide, require;
	    var path = relPath.replace(/\\/g, '/');
	    var deps = goog.dependencies_;
	    for (var i = 0; provide = provides[i]; i++) {
	      deps.nameToPath[provide] = path;
	      deps.pathIsModule[path] = !!opt_isModule;
	    }
	    for (var j = 0; require = requires[j]; j++) {
	      if (!(path in deps.requires)) {
	        deps.requires[path] = {};
	      }
	      deps.requires[path][require] = true;
	    }
	}
}

global['goog'] = goog;
var cachedDeps = goog.dependencies_;
var cachedId   = null;
var pending    = [];


function init(opt) {
	extend(options, opt);

	if (options.closureLibrary===true) {
		options.closureLibrary = options._closureLibrary;
	}

	if (options.closureLibrary) {
		options._basePath = path.join(options.closureLibrary, 'closure/goog/base.js')
		require(options.closureLibrary + '/closure/goog/deps.js');
	}

	cachedDeps = goog.dependencies_;


	return function(development) {
		return (development ? 'goog!' : 'goog-loader/build!') + opt.input;
	}
}

function loadDeps(done)
{
	var id;

	goog.dependencies_ = clone(cachedDeps);
	cachedId = id = new Date().getTime();
	pending.push(done);

	gulp.src(options.js).
	    pipe(through(function(file) {
	    	if (cachedId===id) {
		    	cache[file.path] = depsline(file.path, file.contents.toString());
		    	eval(cache[file.path]);
	    	}

	    }, function() {
	    	if (cachedId===id) {
	    		pending.forEach(function(done) {
	    			done.call();
	    		});

	    		pending = [];
	    	}
	    }));
}
