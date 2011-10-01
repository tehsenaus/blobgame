
var Class = require("coop").Class;

var exports = module.exports = {};


var Vector = exports.Vector = new Class({
	initialize: function (x, y) {
		this.x = x === undefined ? 0 : x;
		this.y = y === undefined ? 0 : y;
	},

	add: function (a) {
		if(Vector.isinstance(a))
			return new Vector(this.x + a.x, this.y + a.y);
		else
			return new Vector(this.x + a, this.y + a);
	},
	sub: function (a) {
		if(Vector.isinstance(a))
			return new Vector(this.x - a.x, this.y - a.y);
		else
			return new Vector(this.x - a, this.y - a);
	},
	mul: function (a) {
		return new Vector(this.x * a, this.y * a);
	},
	div: function (a) {
		return new Vector(this.x / a, this.y / a);
	},

	dot: function (v) {
		return (this.x * v.x) + (this.y * v.y);
	},
	norm: function () {
		return Math.sqrt(this.dot(this));
	},
	normalize: function () {
		return this.div(this.norm());
	},

	toString: function () {
		return "("+this.x+", "+this.y+")";
	}
});

var Rect = exports.Rect = new Class({
	initialize: function () {
		if(arguments.length != 4 && arguments.length != 2)
			arguments = [0,0,0,0];
		if(arguments.length == 4) {
			this.start = new Vector(arguments[0], arguments[1]);
			this.end = new Vector(arguments[2], arguments[3]);
		} else if(arguments.length == 2) {
			this.start = arguments[0];
			this.end = arguments[1];
		}
	},

	contains: function(v) {
		return (
			Math.min(this.start.x,this.end.x) <= v.x && v.x <= Math.max(this.start.x,this.end.x)
			&&
			Math.min(this.start.y,this.end.y) <= v.y && v.y <= Math.max(this.start.y,this.end.y)
		);
	},
	intersect: function(rect) {
		var sx = Math.max(Math.min(this.start.x,this.end.x),Math.min(rect.start.x,rect.end.x));
		var sy = Math.max(Math.min(this.start.y,this.end.y),Math.min(rect.start.y,rect.end.y));
		var ex = Math.min(Math.max(this.start.x,this.end.x),Math.max(rect.start.x,rect.end.x));
		var ey = Math.min(Math.max(this.start.y,this.end.y),Math.max(rect.start.y,rect.end.y));
		return (ex >= sx && ey >= sy) && new Rect(sx,sy,ex,ey);
	},

	render: function(cxt) {
		var s = this.getSize();
		cxt.strokeRect(this.start.x, this.start.y, s.x, s.y);
	},

	getSize: function () {
		return this.end.sub(this.start);
	},

	toString: function () {
		return "("+this.start+", "+this.end+")";
	}
});

var Circle = exports.Circle = new Class({
	initialize: function (position, radius) {
		this.radius = radius;
		this.position = position;
	},

	intersect: function (shape) {
		if(Circle.isinstance(shape)) {
			return this.position.sub(shape.position).norm() <= this.radius + shape.radius;
		}
		return shape.intersect(this.getBounds());
	},

	getBounds: function () {
		return new Rect(this.position.sub(this.radius), this.position.add(this.radius));
	},

	render: function (cxt) {
		cxt.beginPath();
		cxt.arc(this.position.x,this.position.y,this.radius,0,Math.PI * 2,false)
		cxt.closePath();
		cxt.fill();
	}
});
