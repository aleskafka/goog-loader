
var patterns = require('./patterns');
var dependencies = require('./dependencies');


module.exports = function(source, map) {

	var that = this;
	var prolog = [];
	var epilog = [];

	source = source.replace(patterns.comment, function(matches) {
		return matches.replace(/[^\n]/g, ' ');
	});

	source = source.split("\n").map(function(line) {

		line = line.replace(patterns.export, 'module.exports = exports =');

		line = line.replace(patterns.provide, function(matches, namespace) {
			epilog.push("goog.exportPath_('"+namespace+"', "+namespace+", googNamespace)");

			var _parts = namespace.split('.');

			if (_parts[0]!=="goog") {
				prolog.push("var " + _parts[0] + " = {};");
			}

			return _parts.length>1 ? "goog.exportPath_('"+(_parts.slice(1).join('.'))+"', undefined, "+_parts[0]+")" : "";
		});

		line = line.replace(patterns.define, function(matches, name, value) {
			return "goog.exportPath_("+name+", "+value+")";
		});

		line = line.replace(patterns.require, function(matches, assign, namespace) {
			if (dependencies.nameToPath(namespace)) {
				var _parts = namespace.split('.');
				var _prolog = "";
				var _epilog = "";

				if (assign) {
					_prolog = assign;

				} else if (_parts.length===1) {
					_epilog = ";\n var " + namespace + " = googNamespace." + namespace + ";";

				} else {
					if (_parts[0]!=="goog") {
						prolog.push("var " + _parts[0] + " = {};");
					}

					_epilog = ";\n" + "goog.exportPath_('"+(_parts.slice(1).join('.'))+"', googNamespace."+namespace+", "+_parts[0]+")";
				}

				return _prolog + "require('!!goog!"+dependencies.nameToPath(namespace)+"')" + _epilog;
			}

			that.emitError("Namespace '"+namespace+"' not found.");
			return '';
		});

		line = line.replace(patterns.module, function(matches, namespace) {
			epilog.push("goog.exportPath_('"+namespace+"', exports, googNamespace)");
			return '';
		});

		return line;
	});

	return [].concat(prolog, source, epilog).join("\n");
}
