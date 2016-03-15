

exports.namespace = function(name) {
	name = String(name);
	name = name.replace(/\$/, '$$');
	name = name.replace(/\./, '$');
	return name;
}
