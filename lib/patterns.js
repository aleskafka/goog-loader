

exports.comment = /\/\*[^]*?\*\//g;
exports.export = /^\s*exports\s*=/;
exports.define = /^\s*goog\.define\((.+?),(.+?)\)/;
exports.module = /^\s*goog\.module\(\s*['"](.+?)['"]\s*\)/;
exports.provide = /^\s*goog\.provide\(\s*['"](.+?)['"]\s*\)/;
exports.require = /^\s*((?:(?:var|let|const)\s+)?[a-zA-Z_$][a-zA-Z0-9$_\.]*\s*=\s*)?goog\.require\(\s*['"](.+?)['"]\s*\)/;
