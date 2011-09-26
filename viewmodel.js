/**
 * Site View Model
 **/

var Router = require("konode/core/router");
var Class = require("coop").Class;
var resources = require("./resources");

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
