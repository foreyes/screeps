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

function checkBuildFlag(flagName = 'flagflag', timeSlot = 50) {
	if(Memory.ctx[flagName] == 0) {
		Memory.ctx[flagName] = 1;
		return false;
	}
	if(Game.time % timeSlot != 0 && Memory.ctx[flagName] != 1) {
		return false;
	}
	Memory.ctx[flagName] = 2;
	return true;
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
			Memory.ctx.flagRoad1 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag('flagRoad1')) {
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

		    Memory.ctx.flagExtension2 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag('flagExtension2')) {
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

			Memory.ctx.flagExtension3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag('flagExtension3')) {
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

			Memory.ctx.sourceContainerPos = [null, null];
		    for(var i in goals) {
		        var road_path = PathFinder.search(goals[i], {pos: spawn.pos, range: 2}).path;
		        var pos = road_path[0];
		        room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
		        if(i < 2) {
		        	Memory.ctx.sourceContainerPos[i] = pos;
		        } else {
		        	Memory.ctx.controllerContainerPos = pos;
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
		    	Memory.ctx.spawnContainerPos = poss[0];
		    }

		    Memory.ctx.flagContainer3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag('flagContainer3')) {
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
		next: ['statRoad3', 'tower3'],
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
				var container = ctx.room.lookAt(Memory.ctx.spawnContainerPos).filter((item) => {
					return item.structureType == STRUCTURE_CONTAINER
				});
				Memory.ctx.spawnContainerId = container[0].id;

				container = ctx.room.lookAt(Memory.ctx.controllerContainerPos).filter((item) => {
					return item.structureType == STRUCTURE_CONTAINER
				});
				Memory.ctx.controllerContainerId = container[0].id;

				Memory.ctx.sourceContainerIds = [null, null];
				for(var i in ctx.sources) {
					container = ctx.room.lookAt(Memory.ctx.sourceContainerPos[i]).filter((item) => {
						return item.structureType == STRUCTURE_CONTAINER
					});
					Memory.ctx.sourceContainerIds[i] = container[0].id;
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
	statRoad3: {
		wait: 1,
		next: ['road3'],
		init: defaultInit,
		loop: function(ctx) {
			if(!Memory.ctx.flagStatRoad3Start) {
				Memory.ctx.flagStatRoad3Start = Game.time;
			}
			if(Memory.ctx.statsRoad == undefined) {
				Memory.ctx.statsRoad = [];
			}
			var creeps = ctx.room.find(FIND_CREEPS, {
				filter: (creep) => {
					return creep.my;
				}
			});
			var creepPos = creeps.map((creep) => creep.pos);
			for(var i in creepPos) {
				if(!utils.IsItemInList(creepPos[i], Memory.ctx.statsRoad, utils.IsSamePosition)) {
					Memory.ctx.statsRoad.push(creepPos[i]);
				}
			}
			return Game.time - Memory.ctx.flagStatRoad3Start > 500;
		},
		terminate: function(ctx, next) {
			delete Memory.ctx.flagStatRoad3Start;
			defaultTerminate(ctx, next);
		}
	},
	road3: {
		wait: 1,
		next: ['upgrade4'],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			for(var i in Memory.ctx.statsRoad) {
				var pos = Memory.ctx.statsRoad[i];
				ctx.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
			}
			delete Memory.ctx.statsRoad;

			Memory.ctx.workerUpgraderNum = 1;
			Memory.ctx.workerBuilderNum = 3;

			Memory.ctx.flagRoad3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag('flagRoad3')) {
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
			delete Memory.ctx.flagRoad3;
			defaultTerminate(ctx, next);
		}
	},
	tower3: {
		wait: 1,
		next: ['upgrade4'],
		init: defaultInit,
		loop: function(ctx) {
			return true;
		},
		terminate: defaultTerminate
	},
	upgrade4: {
		wait: 2,
		next: [],
		init: defaultInit,
		loop: function(ctx) {
			return true;
		},
		terminate: defaultTerminate
	},
	extension4: {},
	storage: {},
	wallAndRam: {}
};

module.exports = {
	startStage,
    stages
};