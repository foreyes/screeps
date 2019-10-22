var utils = require('utils');

function defaultInit(ctx, next) {
	for(var i in next) {
		var exist = false;
		for(var j in Memory.ctx.Wait) {
			var name = Memory.ctx.Wait[j].name;
			if(name == next[i]) {
				exist = true;
				break;
			}
		}
		if(!exist) {
			Memory.ctx.Wait = Memory.ctx.Wait.concat({name: next[i], wait: stages[next[i]].wait});
		}
	}
}

function defaultTerminate(ctx, next) {
	for(var i in next) {
		for(var j in Memory.ctx.Wait) {
			var name = Memory.ctx.Wait[j].name;
			if(name == next[i]) {
				Memory.ctx.Wait[j].wait -= 1;
			}
		}
	}
}

// loop returning true means need terminate.
var stages = {
	road1: {
		wait: 0,
		next: ['upgrade2'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 0;
			Memory.ctx.workerBuilderNum = 4;
			Memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

			var goals = sources.map((source) => {return source.pos;}).concat(room.controller.pos);
			var res = [];
			for(var i in goals) {
				res = res.concat(PathFinder.search(goals[i], {pos: spawn.pos, range: 2}).path);
			}

			var roomTerrain = Game.map.getRoomTerrain(room.name);
			var tmp = uitils.get_positions_by_dist(room, spawn.pos, 2).filter((pos) => {
				return roomTerrain.get(pos.x, pos.y) != TERRAIN_MASK_WALL;
			});
			res = res.concat(tmp);

			for(var i in res) {
				room.createConstructionSite(res[i].x, res[i].y, STRUCTURE_ROAD);
			}
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0) {
				return false;
			}
			var constructing_roads = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_ROAD;
				}
			});
			return constructing_roads.length == 0;
		},
		terminate: defaultTerminate
	},
	upgrade2: {
		wait: 1,
		next: ['extension2'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 0;
			Memory.ctx.workerUpgraderNum = 4;
		},
		loop: function(ctx) {
			return ctx.room.controller.level >= 2;
		},
		terminate: defaultTerminate
	},
	extension2: {
		wait: 1,
		next: ['upgrade3'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 3;
			Memory.ctx.workerUpgraderNum = 1;

			// TODO:
			var room = ctx.room, spawn = ctx.spawn, rem = 5;

		    for(var dist = 3; rem > 0; dist++) {
		        var positions = utils.get_positions_by_dist(room, spawn.pos, dist);
		        positions = positions.filter((pos) => {
		            return room.lookAt(pos).filter((val) => {
		                return val.type == 'structure' ||
		                       (val.type == 'terrain' && val.terrain == 'wall');
		            }).length == 0;
		        });
		        if(positions.length > rem) {
		            positions = positions.slice(0, rem);
		        }
		        rem = rem - positions.length;
		        positions.forEach(function(pos) {
		            room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
		        });
		    }
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0) {
				return false;
			}
			var constructing_extensions = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_EXTENSION;
				}
			});
			return constructing_extensions.length == 0;
		},
		terminate: defaultTerminate
	},
	upgrade3: {
		wait: 1,
		next: ['extension3'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 0;
			Memory.ctx.workerUpgraderNum = 4;
		},
		loop: function(ctx) {
			return ctx.room.controller.level >= 3;
		},
		terminate: defaultTerminate
	},
	extension3: {
		wait: 1,
		next: ['container3'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 3;
			Memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, rem = 5;

			for(var dist = 3; rem > 0; dist++) {
			    var positions = utils.get_positions_by_dist(room, spawn.pos, dist);
			    positions = positions.filter((pos) => {
			        return room.lookAt(pos).filter((val) => {
			            return val.type == 'structure' ||
			                   (val.type == 'terrain' && val.terrain == 'wall');
			        }).length == 0;
			    });
			    if(positions.length > rem) {
			        positions = positions.slice(0, rem);
			    }
			    rem = rem - positions.length;
			    positions.forEach(function(pos) {
			        room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
			    });
			}
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0) {
				return false;
			}
			var constructing_extensions = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_EXTENSION;
				}
			});
			return constructing_extensions.length == 0;
		},
		terminate: defaultTerminate
	},
	container3: {
		wait: 1,
		next: ['devRoles'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 3;
			Memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

		    var goals = sources.map((source) => {return source.pos;}).concat(room.controller.pos);
		    for(var i in goals) {
		        var road_path = PathFinder.search(spawn.pos, {pos: goals[i], range: 1}).path;
		        var pos = road_path[road_path.length - 1];
		        room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
		    }

		    var poss = utils.get_positions_by_dist(room, spawn.pos, 1).filter((pos) => {
		        return room.lookAt(pos).filter((val) => {
		            return val.type == 'structure' ||
		                   (val.type == 'terrain' && val.terrain == 'wall');
		        }).length == 0;
		    });
		    if(poss.length != 0) {
		    	room.createConstructionSite(poss[0].x, poss[0].y, STRUCTURE_CONTAINER);
		    }
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0) {
				return false;
			}
			var constructing_containers = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_CONTAINER;
				}
			});
			return constructing_containers.length == 0;
		},
		terminate: defaultTerminate
	},
	devRoles: {
		wait: 0,
		next: [],
		init: defaultInit,
		loop: function(ctx) {
			return true;
		}
		terminate: defaultTerminate
	},
	statRoad3: {},
	road3: {},
	tower3: {},
	setRepair3: {},
	upgrade4: {},
	extension4: {},
	storage: {},
	wallAndRam: {}
}