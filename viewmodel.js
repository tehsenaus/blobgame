/**
 * Site View Model
 **/

var Router = require("synergy/core/router");
var coop = require("coop");
var Class = coop.Class, Options = coop.Options;
var resources = require("./resources");

var CanvasRenderer = new Class([Options], {
	initialize: function(canvas, options) {
		this.super(options);

		this.canvas = typeof canvas == "string" ?
			document.getElementById(canvas)	: canvas;
		this.context = this.canvas.getContext("2d");
		this.renderList = [];
		
		var me = this;
		this.canvas.onmousedown = function (e) {
			me.selecting = new Rect(
				e.offsetX, e.offsetY, e.offsetX, e.offsetY
			);
		}
		this.canvas.onmousemove = function (e) {
			if(me.selecting) {
				me.selecting.end.x = e.offsetX;
				me.selecting.end.y = e.offsetY;
			}
		}
		this.canvas.onmouseup = function (e) {
			if(me.selecting && me.options.onSelect && me.selecting.getSize().norm() > 0) {
				var selectList = [];
				me.renderList.forEach(function(o) {
					selectList = selectList.concat(o.intersect(me.selecting));
				}, me);
				me.options.onSelect.call(me, selectList, me.selecting);
			} else if(me.selecting && me.options.onClick) {
				me.options.onClick.call(me, me.selecting.end);
			}
			me.selecting = null;
		}
		window.onmouseup = function () {
			me.selecting = false;
		}
	},

	render: function () {
		var w = this.canvas.width = this.canvas.parentNode.offsetWidth;
		var h = this.canvas.height = this.canvas.parentNode.offsetHeight;
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.renderList.forEach(function (r) {
			r.render(this.context);
		}, this);
		
		if(this.selecting) {
			this.selecting.render(this.context);
		}
	}
});

var Vector = new Class({
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

	dot: function (v) {
		return (this.x * v.x) + (this.y + v.y);
	},
	norm: function () {
		return Math.sqrt(this.dot(this));
	}
});

var Rect = new Class({
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

	render: function(cxt) {
		var s = this.getSize();
		cxt.strokeRect(this.start.x, this.start.y, s.x, s.y);
	},

	getSize: function () {
		return this.end.sub(this.start);
	}
});


var Blob = new Class({
	initialize: function () {
		this.radius = 10;
		this.position = new Vector(100,100);
	},

	render: function (cxt) {
		cxt.fillStyle = this.colour || "rgba(255,0,0,0.5)";
		cxt.beginPath();
		cxt.arc(this.position.x,this.position.y,this.radius,0,Math.PI * 2,false)
		cxt.closePath();
		cxt.fill();
	},

	intersect: function (rect) {
		return rect.contains(this.position) ? [this] : [];
	},

	getBounds: function () {
		return new Rect(this.position.sub(this.radius), this.position.add(this.radius));
	}
});

var GooGame = new Class({
	initialize: function (canvas) {
		var me = this;
		this.selected = [];
		this.renderer = new CanvasRenderer(canvas, {
			onSelect: function (selectList, rect) {
				me.selected = selectList;
				console.log(selectList);
			}
		});

		this.renderer.renderList.push(new Blob());
		setInterval(this.run.bind(this), 50);
	},

	run: function () {
		this.renderer.render();
		this.selected.forEach(function (b) {
			b.getBounds().render(this.renderer.context);
		}, this);
	}
});


ko.bindingHandlers.gameCanvas = {
	init: function(element) {
		window.game = new GooGame(element)
	}
}

var SiteViewModel = new Class({
	initialize: function() {
		this.router = new Router();
		
		this.nav = {};
		this.test = this.nav['test'] = this.router.observable(/^\/test\/(.*)/i, 'test');
		this.test.label = "News Feed";
		this.tasks = this.nav['tasks'] = this.router.observable(/^\/tasks/i, 'tasks');
		this.tasks.label = "Tasks";

		this.site = this.test;
		
		this.router.listen();
	}
});

module.exports = new SiteViewModel();
