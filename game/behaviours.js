
var Class = require("coop").Class;

var exports = module.exports = {};

var Behaviour = exports.Behaviour = new Class({
	enter: function (parent) {
		this.parent = parent;
		return this;
	},
	exit: function (b) {
		if(b == this) {
			return this.parent;
		} else {
			this.parent = this.parent.exit(b);
		}
	},

	update: function (object) {
		this.parent.update(object);
	},

	interact: function (object, objects) {
		this.parent.interact(object, objects);
	}	
});
var NullBehaviour = new Class({
	enter: function (parent) {
		return this;
	},
	exit: function (b) {
		return this;
	},

	update: function (object) {	},
	interact: function (object, objects) {	}
});

exports.Actor = new Class({
	initialize: function () {
		this.behaviour = new NullBehaviour();
	},

	pushBehaviour: function (b) {
		this.behaviour = b.enter(this.behaviour);
	},
	stopBehaviour: function (b) {
		this.behaviour = this.behaviour.exit(b);
	}
})

var Moving = exports.Moving = new Class([Behaviour], {
	update: function (object, dt) {
		object.position = object.position.add(object.velocity.mul(dt));
		this.super(object, dt);
	}
});
var Resistance = exports.Resistance = new Class([Behaviour], {
	update: function (object, dt) {
		var r = object.velocity.norm() * 0.05 * dt;
		object.velocity = object.velocity.mul(Math.max(0, 1.0-r));
		this.super(object, dt);
	}
});


exports.Move = new Class([Behaviour], {
	initialize: function (target) {
		this.moveTarget = target;
	},

	update: function (object) {
		
	}
});


exports.Projectile = new Class([Moving, Resistance], {
	initialize: function () {
		
	}
});

