
var patterns = require('./patterns');


module.exports = function(loader, source) {

	source = source.replace(patterns.comment, function(matches) {
		return matches.replace(/[^\n]/g, ' ');
	});

	return source.split('\n').map(function(line) {

		line = line.replace(patterns.export, 'module.exports = exports =');

		line = line.replace(patterns.provide, function(matches, namespace) {
			return "goog.constructNamespace_('"+namespace+"')";
		});

		line = line.replace(patterns.define, function(matches, name, value) {
			return "goog.exportPath_("+name+", "+value+")";
		});

		line = line.replace(patterns.require, function(matches, assign, namespace) {

			if (namespace in goog.dependencies_.nameToPath) {
				return (assign||'') + "require('goog!"+goog.dependencies_.nameToPath[namespace]+"')";
			}

			loader.emitError("Namespace '"+namespace+"' not found.");
			return '';
		});

		line = line.replace(patterns.module, '');

		return line;

	}).join('\n');
}
