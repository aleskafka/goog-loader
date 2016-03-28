
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var through = require('through');

var clone = require('./clone');
var options = require('./options');
var depsline = require('./depsline');


goog = {
	dependencies_: {
	  pathIsModule: {}, // 1 to 1
	  nameToPath: {}, // 1 to 1
	  requires: {}, // 1 to many
	  visited: {}, // Used when resolving dependencies to prevent us from visiting file twice.
	  written: {}, // Used to keep track of script files we have written.
	  deferred: {}, // Used to track deferred module evaluations in old IEs
	},
	addDependency: function(relPath, provides, requires, opt_isModule) {
		if (relPath[0]!=='/') {
			if (!options.closureLibrary) {
				throw new Error('Missing Closure Library for ' + relPath + ' dependency.');
			}

			relPath = options.closureLibrary + '/closure/goog/' + relPath;
		}

	    var provide, require;
	    var filepath = path.normalize(relPath.replace(/\\/g, '/'));
	    var deps = goog.dependencies_;
	    for (var i = 0; provide = provides[i]; i++) {
	      deps.nameToPath[provide] = filepath;
	      deps.pathIsModule[filepath] = !!opt_isModule;
	    }
	    for (var j = 0; require = requires[j]; j++) {
	      if (!(filepath in deps.requires)) {
	        deps.requires[filepath] = {};
	      }
	      deps.requires[filepath][require] = true;
	    }
	}
}

global['goog'] = goog;
goog.dependencies = clone(goog.dependencies_);
var cachedDeps = clone(goog.dependencies_);
var cache = {};
var pending = [];
var inited = false;


exports.init = function(closureLibrary) {
	if (inited===false) {
		inited = true;

		if (closureLibrary) {
			require(closureLibrary + '/closure/goog/deps.js');
		}

		cachedDeps = clone(goog.dependencies_);
		goog.dependencies = clone(goog.dependencies_);
	}
}


exports.nameToPath = function(namespace) {
	return goog.dependencies.nameToPath[namespace];
}


exports.changed = function(filepath, fn) {
	var prev = cache[filepath]||'';
	cache[filepath] = depsline(filepath, fs.readFileSync(filepath, 'utf-8'));

	if (pending.length) {
		pending.push(fn);

	} else if (filepath.indexOf(options.closureLibrary)===0) {
		fn();

	} else if (prev!==cache[filepath]) {
		pending.push(fn);

		inited = true;
		goog.dependencies_ = clone(cachedDeps);

		gulp.src(options.js).
		    pipe(through(function(file) {
		    	cache[file.path] = depsline(file.path, file.contents.toString());
		    	eval(cache[file.path]);

		    }, function() {
		    	var _pending = pending;
	    		pending = [];

	    		goog.dependencies = clone(goog.dependencies_);
	    		_pending.forEach(function(fn) { fn() });
		    }));

	} else {
		fn();
	}
};


exports.isReachable = function(filepath) {
	if (goog.dependencies.reachable===undefined) {
		goog.dependencies.reachable = {};

		var entry;
		var queue = [options.entry];

		while (queue.length) {
			if (entry = queue.pop()) {
				if (goog.dependencies.reachable[entry]===undefined) {
					goog.dependencies.reachable[entry] = true;

					queue = queue.concat(Object.keys(goog.dependencies.requires[entry]||{}).map(function(namespace) {
						return goog.dependencies.nameToPath[namespace];
					}));
				}
			}
		}
	}

	return !!goog.dependencies.reachable[filepath];
}
