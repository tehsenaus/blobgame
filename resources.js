
var Class = require("coop").Class;
var Resource = require("resource").Resource;

var exports = module.exports = {};

var db;
var MongoDbDataStore = new Class({
	initialize: function (collection) {
		if(!db) {
			console.log("Connecting to DB...")
			//var mongo = require("mongoskin");
			db = mongo.db(mongo_user+':'+mongo_pass+'@dbh30.mongolab.com:27307/task_cloud');
		}
		this.collection = db.collection(collection);
	},

	list: function (callback) {
		this.collection.find().toArray(callback);
	}
});


var TaskResource = new Class([Resource], {
	options: {
		serverDataStoreFactory: function () {
			var mongo_user = 'task_cloud';
			var mongo_pass = '271mI30W76775G6sg38719Q586fjG4';

			
			return new MongoDbDataStore('task');
		}
	},

	list: function (callback) {
		console.log("list");
		
	}
});
exports.tasks = new TaskResource({
	name: "task"
});
