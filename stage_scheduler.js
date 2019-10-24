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
			Memory.ctx.Wait.push({name: next[i], wait: stages[next[i]].wait});
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

function startStage(stageName) {
	Memory.ctx.Wait.push({wait: 0, name: stageName});
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

			var goals = sources.map((source) => {return source.pos;});
			goals.push(room.controller.pos);
			var res = [];
			for(var i in goals) {
				res = res.concat(PathFinder.search(goals[i], {pos: spawn.pos, range: 2}).path);
			}

			var roomTerrain = Game.map.getRoomTerrain(room.name);
			var tmp = utils.get_positions_by_dist(room, spawn.pos, 2).filter((pos) => {
				return roomTerrain.get(pos.x, pos.y) != TERRAIN_MASK_WALL;
			});
			res = res.concat(tmp);

			for(var i in res) {
				room.createConstructionSite(res[i].x, res[i].y, STRUCTURE_ROAD);
			}
			Memory.ctx.flagRoad1 = true;
		},
		loop: function(ctx) {
			if(Memory.ctx.flagRoad1) {
				Memory.ctx.flagRoad1 = false;
				return false;
			}
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
		terminate: function(ctx, next) {
			delete Memory.ctx.flagRoad1;
			defaultTerminate(ctx, next);
		}
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

			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.my && structure.structureType == STRUCTURE_EXTENSION;
				}
			}).length;

			var room = ctx.room, spawn = ctx.spawn, rem = 5 - exts;

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

		    Memory.ctx.flagExtension2 = true;
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0 && !Memory.ctx.flagExtension2) {
				Memory.ctx.flagExtension2 = false;
				return false;
			}
			var constructing_extensions = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_EXTENSION;
				}
			});
			return constructing_extensions.length == 0;
		},
		terminate: function(ctx, next) {
			delete Memory.ctx.flagExtension2;
			defaultTerminate(ctx, next);
		}
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

			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.my && structure.structureType == STRUCTURE_EXTENSION;
				}
			}).length;

			var room = ctx.room, spawn = ctx.spawn, rem = 10 - exts;

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

			Memory.ctx.flagExtension3 = true;
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0 && !Memory.ctx.flagExtension3) {
				Memory.ctx.flagExtension3 = false;
				return false;
			}
			var constructing_extensions = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_EXTENSION;
				}
			});
			return constructing_extensions.length == 0;
		},
		terminate: function(ctx, next) {
			delete Memory.ctx.flagExtension3;
			defaultTerminate(ctx, next);
		}
	},
	container3: {
		wait: 1,
		next: ['devRoles'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			Memory.ctx.workerHarvesterNum = 2;
			Memory.ctx.workerRepairerNum = 2;
			Memory.ctx.workerBuilderNum = 3;
			Memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

		    var goals = sources.map((source) => {return source.pos;});
		    goals.push(room.controller.pos);
		    for(var i in goals) {
		        var road_path = PathFinder.search(goals[i], {pos: spawn.pos, range: 2}).path;
		        var pos = road_path[0];
		        room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
		        if(i < 2) {
		        	ctx.sources[i].memory.containerPos = pos;
		        } else {
		        	ctx.room.controller.memory.containerPos = pos;
		        }
		    }

		    var poss = utils.get_positions_by_dist(room, spawn.pos, 1).filter((pos) => {
		        return room.lookAt(pos).filter((val) => {
		            return val.type == 'structure' ||
		                   (val.type == 'terrain' && val.terrain == 'wall');
		        }).length == 0;
		    });
		    if(poss.length != 0) {
		    	room.createConstructionSite(poss[0].x, poss[0].y, STRUCTURE_CONTAINER);
		    	ctx.spawn.memory.containerPos = poss[0];
		    }

		    Memory.ctx.flagContainer3 = true;
		},
		loop: function(ctx) {
			if(Game.time % 100 != 0 && !Memory.ctx.flagContainer3) {
				Memory.ctx.flagContainer3 = false;
				return false;
			}
			var constructing_containers = ctx.room.find(FIND_CONSTRUCTION_SITES, {
				filter: (site) => {
					return site.my && site.structureType == STRUCTURE_CONTAINER;
				}
			});
			return constructing_containers.length == 0;
		},
		terminate: function(ctx, next) {
			delete Memory.ctx.flagContainer3;
			defaultTerminate(ctx, next);
		}
	},
	devRoles: {
		wait: 1,
		next: [],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			Memory.ctx.flagDevRoles = true;
		},
		loop: function(ctx) {
			if(Game.time % 20 != 0 && !Memory.ctx.flagDevRoles) {
				Memory.ctx.flagDevRoles = false;
				return false;
			}

			// set up container info
			if(!Memory.ctx.flagSetContainerInfo){
				Memory.ctx.flagSetContainerInfo = true;
				var container = ctx.room.lookAt(ctx.spawn.memory.containerPos).filter((item) => {
					return item.structureType == STRUCTURE_CONTAINER
				});
				ctx.spawn.memory.containerId = container[0].id;

				container = ctx.room.lookAt(ctx.room.controller.memory.containerPos).filter((item) => {
					return item.structureType == STRUCTURE_CONTAINER
				});
				ctx.room.controller.memory.containerId = container[0].id;

				for(var i in ctx.sources) {
					container = ctx.room.lookAt(ctx.sources[i].memory.containerPos).filter((item) => {
						return item.structureType == STRUCTURE_CONTAINER
					});
					ctx.sources[i].memory.containerId = container[0].id;
				}
			}

			// spawn carriers and spawner
			if(!Memory.ctx.flagSpawnCarriers) {
				Memory.ctx.carrierNum = 2;
				Memory.ctx.spawnerNum = 1;
				Memory.ctx.workerHarvesterNum = 2;
				Memory.ctx.workerRepairerNum = 1;
				Memory.ctx.workerUpgraderNum = 1;
				Memory.ctx.workerBuilderNum = 0;

				Memory.ctx.flagSpawnCarriers = true;
				Memory.ctx.flagSpawningCarriers = true;
			}
			// check if finished
			if(Memory.ctx.flagSpawningCarriers) {
				if(ctx.carriers.length >= Memory.ctx.carrierNum && ctx.spawners.length >= Memory.ctx.spawnerNum) {
					Memory.ctx.flagSpawningCarriers = false;
				} else {
					return false;
				}
			}

			// spawn miners
			if(!Memory.ctx.flagSpawnMiners) {
				Memory.ctx.minerNum = 2;
				Memory.ctx.workerHarvesterNum = 1;

				Memory.ctx.flagSpawnMiners = true;
				Memory.ctx.flagSpawningMiners = true;
			}
			// check if finished
			if(Memory.ctx.flagSpawningMiners) {
				if(ctx.miners.length >= Memory.ctx.minerNum) {
					Memory.ctx.workerHarvesterNum = 0;

					Memory.ctx.DoNotHarvest = true;
					Memory.ctx.flagSpawningMiners = false;
				} else {
					return false;
				}
			}

			return true;
		},
		terminate: function(ctx, next) {
			delete Memory.ctx.flagDevRoles;
			delete Memory.ctx.flagSpawnCarriers;
			delete Memory.ctx.flagSpawningCarriers;
			delete Memory.ctx.flagSpawnMiners;
			delete Memory.ctx.flagSpawningMiners;
			defaultTerminate(ctx, next);
		}
	},
	statRoad3: {},
	road3: {},
	tower3: {},
	setRepair3: {},
	upgrade4: {},
	extension4: {},
	storage: {},
	wallAndRam: {}
};

module.exports = {
    stages
};