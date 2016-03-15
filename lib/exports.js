
var acorn = require('acorn');
var through2 = require('through2');
var Minimatch = require('minimatch').Minimatch;
var Buffer = require('buffer').Buffer;
var format = require('./format');


module.exports = function(patterns) {
	patterns = Array.isArray(patterns) ? patterns : [patterns];
	patterns = patterns.map(function(pattern) {
		return new Minimatch(pattern, {});
	});

	return through2.obj(function(file, enc, cb) {
		if (shouldCompile(patterns, file)) {

			var moduleCall, moduleSymbol, requireCall, requireSymbol;

			var source = file.contents.toString();
			var ast = acorn.parse(source);

			if (moduleCall = findModuleCall(ast)) {
				moduleSymbol = "_closure." + format.namespace(moduleCall.arguments[0].value);

				ast.body.reverse();
				ast.body.forEach(function(node) {
					if (node.type==='ExpressionStatement'
						&& node.expression.type==='AssignmentExpression'
						&& isStatementExports(node.expression.left)
					) {
						var symbolend = source.substr(node.end-1, 1)===';' ? ' ' : '; ';
						var symbol = source
							.substr(node.start, node.expression.left.end-node.start)
							.substr('exports.'.length);

						symbol = symbol ? [moduleSymbol, symbol].join('.') : moduleSymbol;

						if (requireCall = findGoogCall(node.expression.right, 'require')) {
							requireSymbol = "_closure." + format.namespace(requireCall.arguments[0].value);
							requireSymbol = requireSymbol + source.substr(requireCall.end, node.end-requireCall.end);
							requireSymbol = requireSymbol.replace(/;$/, '');

							// exports.foo = goog.require('foo').test;
							source = source.substr(0, node.start)
								+ source.substr(requireCall.start, requireCall.end-requireCall.start) // goog.require('foo');
								+ '; '
								+ source.substr(node.start, requireCall.start-node.start) // exports.foo =
								+ moduleCall.arguments[0].value // foo
								+ source.substr(requireCall.end, node.end-requireCall.end) // .test
								+ symbolend
								+ 'goog.exportSymbol("' + symbol + '", ' // _closure.[module.]foo
								+ 	'goog.getObjectByName("'+ requireSymbol +'")'
								+ ');'
								+ source.substr(node.end);

						} else if (node.expression.right.type==='ObjectExpression' && node.expression.right.properties.length===0) {
							source = source.substr(0, node.end) // exports.foo = x;
								+ symbolend
								+ 'goog.exportSymbol("' + symbol + '", {});' // _closure.[module.]foo
								+ source.substr(node.end);

						} else {
							source = source.substr(0, node.end) // exports.foo = x;
								+ symbolend
								+ 'goog.exportSymbol("' + symbol + '", ' // _closure.[module.]foo
								+ 	source.substr(node.start, node.expression.left.end-node.start) // exports.x
								+ ');'
								+ source.substr(node.end);
						}
					}
				});

				if (moduleCall = findModuleCall(acorn.parse(source))) {
					source = source.substr(0, moduleCall.end)
						+ "\ngoog.constructNamespace_('"+moduleSymbol+"')"
						+ source.substr(moduleCall.end);
				}
			}

			file.contents = new Buffer(source);
		}

		cb(null, file);
	});
}


function shouldCompile(patterns, file) {
	if (file.isNull()) {
		return false;
	}

	if (patterns.some(function(mm) { return mm.match(file.path); })) {
		var source = file.contents.toString();

		return ['exports.', 'exports[', 'exports=', 'exports '].some(function(pattern) {
			return source.indexOf(pattern)!==-1;
		});
	}

	return false;
}


function isStatementExports(node) {
	if (node.object) {
		return isStatementExports(node.object);

	} else if (node.name==='exports') {
		return true;
	}

	return false;
}


function findModuleCall(ast) {
	var moduleCall;
	for (var i=0; i<ast.body.length; i++) {
		if (ast.body[i].type==='ExpressionStatement') {
			if (moduleCall = findGoogCall(ast.body[i].expression, 'module')) {
				return moduleCall;
			}
		}
	}
}


function findGoogCall(node, type) {
	if (node.type==='MemberExpression') {
		return findGoogCall(node.object, type);
	}

	return node.type==='CallExpression'
		&& node.callee
		&& node.callee.type==='MemberExpression'
		&& node.callee.object
		&& node.callee.object.name==='goog'
		&& node.callee.property
		&& node.callee.property.name===type
		&& node;
}
