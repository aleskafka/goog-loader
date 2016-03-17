
var fs = require('fs');


module.exports = function() {}

module.exports.pitch = function(source, map) {
	this.cacheable(true);

	source = fs.readFileSync(this.resourcePath, 'utf-8');
	source = "global.googNamespace = {};"
		 + "global.goog = {};"
		 + "global.CLOSURE_NO_DEPS=true;"
		 + "(function() { "
			 + source.replace(/var goog = goog \|\| \{\};/, '')
		 + " }).call(global)";

	return this.callback(null, source, map);
}
