
var fs = require('fs');
var path = require('path');
var options = require('./index').options;
var loadDeps = require('./index').loadDeps;

var loader = require('./lib/loader');
var baseFile = null;

module.exports = function(source, map) {

	if (baseFile === null) {
		baseFile = fs.readFileSync(path.join(options.closureLibrary||options._closureLibrary, 'closure/goog/base.js'), 'utf-8');
		baseFile = baseFile.replace(/var goog = goog \|\| \{\};/, '');
	}

	var callback = this.async();

	loadDeps(function(source, map) {
		var init = "";
		init += options.globalObj + "['goog'] = {};\n";
		init += options.globalObj + ".CLOSURE_NO_DEPS=true;";
		init += "(function() { " + baseFile + " }).call(" + options.globalObj + ");\n";

		source = init + source + "\n\n if (typeof imports==='object') module.exports = imports;";

		callback(null, loader(this, source), map);
	}.bind(this, source, map));
}
