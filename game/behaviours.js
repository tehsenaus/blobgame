
var Class = require("coop").Class;

var exports = module.exports = {};

var Behaviour = exports.Behaviour = new Class({
	enter: function (parent) {
		this.parent = parent;
	},
	exit: function () {
		return this.parent;	
	},

	update: function (object) {
		
	},

	interact: function (object, objects) {
		
	}
});
exports.Actor = new Class({
	initialize: function () {
		this.behaviour = new Behaviour();
	},

	pushBehaviour: function (b) {
		this.behaviour = b.enter(this.behaviour);
	}
})

exports.Move = new Class([Behaviour], {
	initialize: function (target) {
		this.moveTarget = target;
	},

	update: function (object) {
		
	}
});
