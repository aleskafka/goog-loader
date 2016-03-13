
var patterns = require('./patterns');

module.exports = function(loader, source) {

	return source.replace(patterns.comment, '').split('\n').map(function(line) {

		line = line.replace(patterns.provide, function(matches, namespace) {
			return "goog.constructNamespace_('"+namespace+"')";
		});

		line = line.replace(patterns.define, function(matches, name, value) {
			return "goog.exportPath_("+name+", "+value+");";
		});

		line = line.replace(patterns.require, function(matches, namespace) {

			if (namespace in goog.dependencies_.nameToPath) {
				return "if (goog.isProvided_('"+namespace+"') === false) { "
					 + "require('goog!"+goog.dependencies_.nameToPath[namespace]+"');"
					 + " }";
			}

			loader.emitError("Namespace '"+namespace+"' not found.");
			return '';
		});

		return line;

	}).join('\n');
}
