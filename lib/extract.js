
var patterns = require('./patterns');


module.exports = function(contents) {
	var modules, provides, requires;

	// Goog base.js provides goog implicitly.
	if (contents.indexOf('* @provideGoog') != -1) {
	  modules = [];
	  provides = ['goog'];
	  requires = [];

	} else {
	  // Remove block comments to ignore commented goog.provide and goog.require.
	  // http://stackoverflow.com/a/2458858/233902
	  var contentsLines = contents.replace(patterns.comment, '').split('\n');
	  modules = getMatches(contentsLines, patterns.module);
	  provides = getMatches(contentsLines, patterns.provide).concat(modules).sort();
	  requires = getMatches(contentsLines, patterns.require, 2).sort();
	}

	if (provides.length===0 && requires.length===0) {
		return false;
	}

	return {
		modules: modules,
		provides: provides,
		requires: requires
	}
}

var getMatches = function(contentsLines, regex, pos) {
  var matches = [];
  contentsLines.forEach(function(line) {
    var match = line.match(regex);
    if (!match || matches.indexOf(match[pos||1]) > -1) return;
    matches.push(match[pos||1]);
  });
  return matches;
};
