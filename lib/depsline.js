

var extract = require('./extract');


module.exports = function(filePath, contents) {
	var deps;
	if (deps = extract(contents)) {
		return 'goog.addDependency(\'%depsPath\', [%provides], [%requires], %isModule);'
		  .replace('%depsPath', filePath)
		  .replace('%provides', argify(deps.provides))
		  .replace('%requires', argify(deps.requires))
		  .replace('%isModule', String(!!deps.modules.length));
	}

	return '';
}


var argify = function(array) {
  return function() {
    return array.map(function(item) {
      return '\''+ item + '\'';
    }).join(', ');
  }
};