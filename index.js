
var gulp = require('gulp');
var through = require('through');

var path = require('path');
var resolve = require('resolve');

var clone = require('./lib/clone');
var loader = require('./lib/loader');
var changed = require('./lib/changed');
var depsline = require('./lib/depsline');

var options = {};
var cache = {};

options._closureLibrary = resolve.sync('google-closure-library', { basedir: __dirname });
options._closureLibrary = path.resolve(options._closureLibrary, '../../../..');

module.exports = function(source, map) {
	this.cacheable(true);

	if (changed(cache, this.resourcePath)) {

		var callback = this.async();

		loadDeps(function(source, map) {
			callback(null, loader(this, source), map);
		}.bind(this, source, map));

	} else {
		this.callback(null, loader(this, source), map);
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
	for (var key in opt) {
		options[key] = opt[key];
	}

	if (options.closureLibrary===true) {
		options.closureLibrary = options._closureLibrary;
	}

	if (options.closureLibrary) {
		require(options.closureLibrary + '/closure/goog/deps.js');
	}

	cachedDeps = goog.dependencies_;
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
