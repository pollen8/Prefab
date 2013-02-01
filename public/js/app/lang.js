// Simple language string manager 
define(function() {
 
  return {
	  get: function (k) {
		if (this.hasOwnProperty(k)) {
			return this[k];
		} else {
			return k;
		}
	  },
	  set: function (k, v) {
		  // Cant set reserved strings!
		  if (k === 'get' || k === 'set') {
			  return;
		  }
		  this[k] = v;
	  },
	  'Add element': 'Add an element'
	};
});

