
var extract = require('./extract');


module.exports = function(filePath, contents) {
	var deps;
	if (deps = extract(contents)) {
		return 'goog.addDependency(%depsPath, %provides, %requires, %isModule);'
		  .replace('%depsPath', JSON.stringify(filePath))
		  .replace('%provides', JSON.stringify(deps.provides))
		  .replace('%requires', JSON.stringify(deps.requires))
		  .replace('%isModule', JSON.stringify(!!deps.modules.length));
	}

	return '';
}
