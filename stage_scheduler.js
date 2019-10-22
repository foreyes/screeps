var utils = require('utils');

var stages = {
	empty: {
		CheckAvailable: function(ctx) {

		},
		Action: function(ctx) {

		},
		CheckFinish: function(ctx) {

		},
		AfterFinish: function(ctx) {

		}
	}
	road1: {
		CheckAvailable: function(ctx) {
			return true;
		},
		Action: function(ctx) {
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
		CheckFinish: function(ctx) {
			return Memory.ctx.FlagRoad1 || ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_ROAD;
				}
			}).length == 0;
		},
		AfterFinish: function(ctx) {
			Memory.ctx.FlagRoad1 = true;
		}
	},
	upgrade2: {
		CheckAvailable: function(ctx) {
			return Memory.ctx.FlagRoad1;
		},
		Action: function(ctx) {
			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 1;
			Memory.ctx.workerBuilderNum = 0;
			Memory.ctx.workerUpgraderNum = 4;
		},
		CheckFinish: function(ctx) {
			return ctx.room.controller.level >= 2;
		},
		AfterFinish: function(ctx) {

		}
	},
	extension2: {
		CheckAvailable: function(ctx) {
			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.structureType == STRUCTURE_EXTENSION && structure.my;
				}
			});
			return ctx.room.controller.level >= 2 && exts < 5;
		},
		Action: function(ctx) {
			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.structureType == STRUCTURE_EXTENSION && structure.my;
				}
			});
			var room = ctx.room, spawn = ctx.spawn, rem = 5 - exts.length;

		    for(var dist = 3; rem > 0; dist++) {
		        var positions = get_positions_by_dist(room, spawn.pos, dist);
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
		CheckFinish: function(ctx) {
			return Memory.ctx.FlagExtension2 || ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_EXTENSION;
				}
			}).length == 0;
		},
		AfterFinish: function(ctx) {
			Memory.ctx.FlagExtension2 = true;
		}
	},
	upgrade3: {

	},
	extension3: {

	},
	container3: {

	},
	devRoles: {

	},
	statRoad3: {

	},
	road3: {

	},
	tower3: {

	},
	setRepair3: {

	},
	upgrade4: {

	},
	extension4: {

	},
	storage: {

	},
	willAndRam: {

	}
}