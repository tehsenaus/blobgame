/**
 * Site View Model
 **/

var Router = require("synergy/core/router");
var coop = require("coop");
var Class = coop.Class, Options = coop.Options;
var resources = require("./resources");
var GooGame = window.GooGame = require("./game");


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
