
module.exports = clone = function(obj) {

  if (typeof obj == 'object') {
    if (obj.length && parseInt(obj.length, 10)===obj.length) {
      var cloned = [];
      for (var i=0; i<obj.length; i++) {
        cloned.push(clone(obj[i]));
      }

    } else {
      var cloned = {};
      for (var key in obj) {
        cloned[key] = clone(obj[key]);
      }
    }

    return cloned;
  }

  return obj;
};