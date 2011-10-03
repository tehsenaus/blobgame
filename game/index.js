
var coop = require("coop");
var Class = coop.Class, Options = coop.Options;

var behaviours = require("./behaviours");

var shapes = require("./shapes");
var Vector = shapes.Vector, Rect = shapes.Rect;


var CanvasRenderer = new Class([Options], {
	initialize: function(canvas, options) {
		this.super(options);
			
		console.log("init", canvas);
		this.canvas = typeof canvas == "string" ?
			document.getElementById(canvas)	: canvas;
		this.context = this.canvas.getContext("2d");
		this.renderList = [];
		
		var me = this;
		this.canvas.oncontextmenu = function (e) {
			return false;
		}
		this.canvas.onmousedown = function (e) {
			if(e.which == 1) {
				me.selecting = new Rect(
					e.offsetX, e.offsetY, e.offsetX, e.offsetY
				);
				if(me.options.onSelect) {
					selectList = [];
					me.renderList.forEach(function(o) {
						selectList = selectList.concat(o.intersect(me.selecting));
					}, me);
					me.options.onSelect.call(me, selectList, me.selecting);
				}
			} else if(e.which == 3) {
				me.options.onClick.call(me, new Vector(e.offsetX, e.offsetY));
			}
			return false;
		}
		this.canvas.onmousemove = function (e) {
			if(me.selecting) {
				me.selecting.end.x = e.offsetX;
				me.selecting.end.y = e.offsetY;
			}
		}
		this.canvas.onmouseup = function (e) {
			if(me.selecting) {
				me.selecting.end.x = e.offsetX;
				me.selecting.end.y = e.offsetY;
			}
			if(me.selecting && me.options.onSelect && me.selecting.getSize().norm() > 0) {
				var selectList = [];
				me.renderList.forEach(function(o) {
					selectList = selectList.concat(o.intersect(me.selecting));
				}, me);
				me.options.onSelect.call(me, selectList, me.selecting);
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


var Game = new Class({
	initialize: function (canvas, options) {
		console.log("game", canvas, options);
		this.renderer = new CanvasRenderer(canvas, options);
		this.objects = [];
		this.time = new Date().getTime();
	},
	add: function(object) {
		this.objects.push(object);
	},
	run: function () {
		var t = new Date().getTime();
		var dt = (t - this.time) / 1000;
		this.time = t;

		this.objects.forEach(function (o) {
			o.update(dt);
		});
		this.objects.forEach(function (o) {
			o.interact(this.objects, dt);
		}, this);
		this.objects = this.objects.filter(function (o) {
			return !o.dead;
		});
		this.renderer.renderList = this.objects;
		this.renderer.render();
	}
});
var GameObject = new Class([behaviours.Actor], {
	update: function (dt) {
		if(this.dead) return false;
		this.behaviour.update(this, dt);
	},
	interact: function (objects, dt) {
		if(this.dead) return false;
		this.behaviour.interact(this, objects, dt);
	},
	render: function (ctx) {
		
	}
});


var BaseBlob = new Class([shapes.Circle, GameObject], {
	initialize: function (owner, position, radius) {
		this.super(position, radius);
		this.owner = owner;
		this.density = 10;
		this.mass = Math.PI * this.radius * this.radius * this.density;
	},

	intersect: function (shape) {
		return this.super(shape) ? [this] : [];
	},

	addMass: function (m) {
		this.mass += m;
		if(this.mass > 0)
			this.radius = Math.sqrt(this.mass / (Math.PI * this.density));
		else
			this.dead = true;
	},

	consume: function (b) {
		if(this.owner != b.owner) {
			var dm = Math.min(b.mass, this.mass);
			b.addMass(dm);
			this.addMass(-dm);
			b.minify();
		} else {
			this.addMass(b.mass);
			b.dead = true;
		}
	},

	render: function (cxt) {
		cxt.fillStyle = this.owner ? "rgba(255,0,0,0.5)" :"rgba(0,0,255,0.5)";
		this.super(cxt);
	}
});

var Projectile = new Class([BaseBlob], {
	initialize: function (owner, position, radius, target) {
		this.super(owner, position, radius);
		
		this.speed = 100;
		var delta = target.position.sub(this.position).normalize();
		
		this.velocity = delta.mul(this.speed);
		this.pushBehaviour(new behaviours.Projectile())
	},

	interact: function(objects) {
		objects.forEach(function(o) {
			if(o != this && !o.dead && o.owner != this.owner && !Projectile.isinstance(o) && this.intersect(o).length) {
				var a, b;
				if(Projectile.isinstance(o) && this.mass > o.mass) {
					a = this, b = o;
				} else {
					a = o, b = this;
				}
				a.consume(b);
			}
		}, this);
	},

	minify: function () {
		window.game.add(new MiniBlob(
			this.owner, this.position, this.radius
		));
		this.dead = true;
	}
});

var MiniBlob = new Class([BaseBlob], {
	speed: 6,

	render: function (ctx) {
		if(this.dead) return false;
		var target;
		if(window.game.renderer.renderList.some(function (b) {
			target = b;
			return b.owner == this.owner && Blob.isinstance(b);
		}, this)) {
			if(this.intersect(target).length) {
				target.consume(this);
			} else {
				this.position = this.position.add(
					target.position.sub(this.position).normalize().mul(this.speed)
				);
			}
		}
		if(!this.dead)
			this.super(ctx);
	}
});


var Blob = new Class([BaseBlob], {
	rechargeMs: 250,
	range: 150,

	initialize: function (owner, position) {
		this.super(owner, position, 40);
		this.speed = 4;
		this.lastAttack = 0;
	},

	move: function (p) {
		this.moveTo = p;
		this.target = null;
	},
	attack: function (t) {
		this.target = t;
	},

	isSelectable: function () {
		return this.owner;
	},

	render: function (cxt) {
		if(this.moveTo) {
			var delta = this.moveTo.sub(this.position);
			if(delta.norm() >= this.speed) {
				this.position = this.position.add(delta.normalize().mul(this.speed));
			} else {
				this.position = this.moveTo;
				this.moveTo = null;
			}
		}

		this.super(cxt);
	},

	interact: function(objects) {
		var target = this.target, d = Infinity;
		if(!target) {
			var _target;	
			objects.forEach(function (o) {
				if(o.owner != this.owner && !o.dead) {
					var nd = this.position.sub(o.position).norm() - this.radius - o.radius;
					if(nd < d) {
						_target = o;
						d = nd;
					}
				}
			}, this);

			if(d <= this.range)
				target = _target;
		}

		if(target)
			this._attack(target);
	},

	_attack: function(target) {
		if(game.time - this.lastAttack >= this.rechargeMs) {
			var m = this.mass * 0.01;
			window.game.add(new Projectile(
				this.owner,
				this.position.add(target.position.sub(this.position).normalize().mul(this.radius)),
				Math.sqrt(m / (Math.PI * this.density)), target
			));

			this.addMass(-m);
			this.lastAttack = game.time;
		}
	},

	intersect: function (rect) {
		return rect.intersect(this.getBounds()) ? [this] : [];
	},

	getBounds: function () {
		return new Rect(this.position.sub(this.radius), this.position.add(this.radius));
	}
});

var GooGame = module.exports = new Class([Game], {
	initialize: function (canvas) {
		console.log("start googame");
		var me = this;
		this.selected = [];
		this.super(canvas, {
			onSelect: function (selectList, rect) {
				me.selected = selectList.filter(function (b) {
					return b.isSelectable();
				});
			},
			onClick: function (v) {
				var targets = [];
				me.renderer.renderList.forEach(function (b) {
					if(!b.owner) {
						targets = targets.concat(b.intersect(new Rect(v,v)));
					}
				});
				if(targets.length) {
					me.selected.forEach(function(b){
						b.attack(targets[0]);
					});
				} else {
					me.selected.forEach(function(b) {
						b.moveTo = v;
					});
				}
			}
		});

		this.add(new Blob(true, new Vector(100, 100)));
		this.add(new Blob(true, new Vector(100, 150)));
		this.add(new Blob(false, new Vector(300, 100)));
		setInterval(this.run.bind(this), 20);
	},
	run: function () {
		this.super();
		this.selected.forEach(function (b) {
			b.getBounds().render(this.renderer.context);
		}, this);
	}
});
