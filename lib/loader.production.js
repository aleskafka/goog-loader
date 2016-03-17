

var options = require('./options');
var extract = require('./extract');
var format = require('./format');


module.exports = function(source, map) {

	var deps = extract(source);

	if (deps && deps.modules.length) {
		return "module.exports = googNamespace."+format.namespace(deps.modules[0])+";";
	}

	return "module.exports = {};";
}
