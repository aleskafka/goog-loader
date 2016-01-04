
var fs = require('fs');
var depsline = require('./depsline');


module.exports = function(cache, changed) {
	var deps, previous;

	deps = depsline(changed, fs.readFileSync(changed, 'utf-8'));
	previous = changed in cache ? cache[changed] : '';

	cache[changed] = deps;
	return deps!==previous;
};
