
var fs = require('fs');
var path = require('path');
var options = require('./index').options;

var baseFile = null;

module.exports = function(source, map) {

	if (baseFile === null) {
		baseFile = fs.readFileSync(path.join(options.closureLibrary, 'closure/goog/base.js'), 'utf-8');
		baseFile = baseFile.replace(/var goog = goog \|\| \{\};/, '');
	}

	var init = "";
	init += options.globalObj + "['goog'] = {};\n";
	init += options.globalObj + ".CLOSURE_NO_DEPS=true;";
	init += "(function() { " + baseFile + " }).call(" + options.globalObj + ");\n";

	source = init + source + "\n\n if (typeof imports==='object') module.exports = imports;";

	this.callback(null, source, map);
}