var utils = require('utils');

function defaultInit(ctx, next) {
	for(var i in next) {
		var exist = false;
		for(var j in ctx.room.memory.ctx.Wait) {
			var name = ctx.room.memory.ctx.Wait[j].name;
			if(name == next[i]) {
				exist = true;
				break;
			}
		}
		if(!exist) {
			ctx.room.memory.ctx.Wait.push({name: next[i], wait: stages[next[i]].wait});
		}
	}
}

function defaultTerminate(ctx, next) {
	for(var i in next) {
		for(var j in ctx.room.memory.ctx.Wait) {
			var name = ctx.room.memory.ctx.Wait[j].name;
			if(name == next[i]) {
				ctx.room.memory.ctx.Wait[j].wait -= 1;
			}
		}
	}
}

function checkBuildFlag(ctx, flagName = 'flagflag', timeSlot = 50) {
	if(ctx.room.memory.ctx[flagName] == 0) {
		ctx.room.memory.ctx[flagName] = 1;
		return false;
	}
	if(Game.time % timeSlot != 0 && ctx.room.memory.ctx[flagName] != 1) {
		return false;
	}
	ctx.room.memory.ctx[flagName] = 2;
	return true;
}

function startStage(stageName, roomName) {
	Memory.rooms[roomName].ctx.Wait.push({wait: 0, name: stageName});
}

// loop returning true means need terminate.
var stages = {
	stage2: {
		wait: 0,
		next: [],
		init: defaultInit,
		loop: function(ctx) {
			if(ctx.room.controller.level < 2) return false;

			if(!ctx.room.memory.ctx.flagSetupNum) {
				ctx.room.memory.ctx.fillerNum = 2;
				ctx.room.memory.ctx.upgraderNum = 1;
				ctx.room.memory.ctx.builderNum = 2;
				ctx.room.memory.ctx.flagSetupNum = true;
			}
			var csl = ctx.room.find(FIND_CONSTRUCTION_SITES).length;
			if(csl == 0) {
				ctx.room.memory.ctx.builderNum = 0;
				ctx.room.memory.ctx.upgraderNum = 4;
			}
			return ctx.room.controller.level >= 3;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.upgraderNum = 1;
			ctx.room.memory.ctx.repairerNum = 1;
			delete ctx.room.memory.ctx.flagSetupNum;
			defaultTerminate(ctx, next);
		}
	},
	stage3: {
		wait: 0,
		next: [],
		init: defaultInit,
		loop: function(ctx) {
			if(ctx.room.controller.level < 3) return false;
			if(!ctx.room.memory.ctx.flagInit) {
				var exts = ctx.room.find(FIND_STRUCTURES, {
					filter: (structure) => {
						return structure.my && structure.structureType == STRUCTURE_EXTENSION;
					}
				}).length;

				var room = ctx.room, spawn = ctx.spawn, rem = 10 - exts;

				for(var dist = 5; rem > 0; dist++) {
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

				room.createConstructionSite(spawn.pos.x - 1, spawn.pos.y - 1, STRUCTURE_TOWER);

				ctx.room.memory.ctx.builderNum = 3;
				ctx.room.memory.ctx.flagInit = true;
			}
			var constructing = ctx.room.find(FIND_CONSTRUCTION_SITES);
			if(constructing.length == 0) {
				ctx.room.memory.ctx.builderNum = 0;
				ctx.room.memory.ctx.upgraderNum = 3;
				ctx.room.memory.ctx.keepLevel = false;
				ctx.keepLevel = false;
			}
			if(ctx.room.controller.level >= 4) {
				ctx.room.createConstructionSite(ctx.spawn.pos.x - 1, ctx.spawn.pos.y - 2, STRUCTURE_STORAGE);
				startStage('build_1', ctx.room.name);
				startStage('build_1', ctx.room.name);
			}
			return ctx.room.controller.level >= 4;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.upgraderNum = 1;
			ctx.room.memory.ctx.keepLevel = true;
			delete ctx.room.memory.ctx.flagInit;
			defaultTerminate(ctx, next);
		}
	},
	build_1: {
		wait: 0,
		next: [],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			ctx.room.memory.ctx.builderNum += 1;
		},
		loop: function(ctx) {
			var constructing = ctx.room.find(FIND_CONSTRUCTION_SITES);
			return constructing.length == 0;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.builderNum -= 1;
			defaultTerminate(ctx, next);
		}
	},
	upgrading: {
		wait: 0,
		next: [],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			ctx.room.memory.ctx.fillerNum = 3;
			ctx.room.memory.ctx.upgraderNum = 3;
			ctx.room.memory.ctx.keepLevel = false;
		},
		loop: function(ctx) {
			if(!ctx.storage) return true;
			if(ctx.storage.store[RESOURCE_ENERGY] >= 800000) {
				ctx.room.memory.ctx.fillerNum = 3;
				ctx.room.memory.ctx.upgraderNum = 3;
				ctx.room.memory.ctx.keepLevel = false;
			}
			if(ctx.storage.store[RESOURCE_ENERGY] < 200000) {
				ctx.room.memory.ctx.fillerNum = 2;
				ctx.room.memory.ctx.upgraderNum = 1;
				ctx.room.memory.ctx.keepLevel = true;
			}
			return false;
		},
		terminate: defaultTerminate
	},
	road1: {
		wait: 0,
		next: ['upgrade2'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 0;
			ctx.room.memory.ctx.workerBuilderNum = 4;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

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
			ctx.room.memory.ctx.flagRoad1 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagRoad1')) {
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
			delete ctx.room.memory.ctx.flagRoad1;
			defaultTerminate(ctx, next);
		}
	},
	upgrade2: {
		wait: 1,
		next: ['extension2'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 1;
			ctx.room.memory.ctx.workerBuilderNum = 0;
			ctx.room.memory.ctx.workerUpgraderNum = 4;
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

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 1;
			ctx.room.memory.ctx.workerBuilderNum = 3;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

			// TODO: ctx
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

		    ctx.room.memory.ctx.flagExtension2 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagExtension2')) {
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
			delete ctx.room.memory.ctx.flagExtension2;
			defaultTerminate(ctx, next);
		}
	},
	upgrade3: {
		wait: 1,
		next: ['extension3'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 1;
			ctx.room.memory.ctx.workerBuilderNum = 0;
			ctx.room.memory.ctx.workerUpgraderNum = 4;
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

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 1;
			ctx.room.memory.ctx.workerBuilderNum = 3;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

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

			ctx.room.memory.ctx.flagExtension3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagExtension3')) {
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
			delete ctx.room.memory.ctx.flagExtension3;
			defaultTerminate(ctx, next);
		}
	},
	container3: {
		wait: 1,
		next: ['devRoles'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerHarvesterNum = 2;
			ctx.room.memory.ctx.workerRepairerNum = 2;
			ctx.room.memory.ctx.workerBuilderNum = 3;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, sources = ctx.sources;

		    var goals = sources.map((source) => {return source.pos;});
		    goals.push(room.controller.pos);

			ctx.room.memory.ctx.sourceContainerPos = [null, null];
		    for(var i in goals) {
		        var road_path = PathFinder.search(goals[i], {pos: spawn.pos, range: 2}).path;
		        var pos = road_path[0];
		        room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
		        if(i < 2) {
		        	ctx.room.memory.ctx.sourceContainerPos[i] = pos;
		        } else {
		        	ctx.room.memory.ctx.controllerContainerPos = pos;
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
		    	ctx.room.memory.ctx.spawnContainerPos = poss[0];
		    }

		    ctx.room.memory.ctx.flagContainer3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagContainer3')) {
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
			delete ctx.room.memory.ctx.flagContainer3;
			defaultTerminate(ctx, next);
		}
	},
	devRoles: {
		wait: 1,
		next: ['statRoad3', 'tower3'],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			ctx.room.memory.ctx.flagDevRoles = true;
		},
		loop: function(ctx) {
			if(Game.time % 20 != 0 && !ctx.room.memory.ctx.flagDevRoles) {
				ctx.room.memory.ctx.flagDevRoles = false;
				return false;
			}

			// set up container info
			if(!ctx.room.memory.ctx.flagSetContainerInfo){
				var pos = ctx.room.memory.ctx.spawnContainerPos;
				pos = new RoomPosition(pos.x, pos.y, pos.roomName);
				var container = ctx.room.lookAt(pos).filter((item) => {
					return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
				});
				ctx.room.memory.ctx.spawnContainerId = container[0].structure.id;
		
				pos = ctx.room.memory.ctx.controllerContainerPos;
				pos = new RoomPosition(pos.x, pos.y, pos.roomName);
				container = ctx.room.lookAt(pos).filter((item) => {
					return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
				});
				ctx.room.memory.ctx.controllerContainerId = container[0].structure.id;

				ctx.room.memory.ctx.sourceContainerIds = [null, null];
				for(var i in ctx.sources) {
					pos = ctx.room.memory.ctx.sourceContainerPos[i];
					pos = new RoomPosition(pos.x, pos.y, pos.roomName);
					container = ctx.room.lookAt(pos).filter((item) => {
						return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
					});
					ctx.room.memory.ctx.sourceContainerIds[i] = container[0].structure.id;
				}
				ctx.room.memory.ctx.flagSetContainerInfo = true;
			}

			// spawn carriers and spawner
			if(!ctx.room.memory.ctx.flagSpawnCarriers) {
				ctx.room.memory.ctx.carrierNum = 3;
				ctx.room.memory.ctx.workerHarvesterNum = 2;
				ctx.room.memory.ctx.workerRepairerNum = 1;
				ctx.room.memory.ctx.workerUpgraderNum = 1;
				ctx.room.memory.ctx.workerBuilderNum = 0;

				ctx.room.memory.ctx.flagSpawnCarriers = true;
				ctx.room.memory.ctx.flagSpawningCarriers = true;
			}
			// check if finished
			if(ctx.room.memory.ctx.flagSpawningCarriers) {
				if(ctx.carriers.length + ctx.spawners.length >= ctx.room.memory.ctx.carrierNum) {
					ctx.room.memory.ctx.flagSpawningCarriers = false;
				} else {
					return false;
				}
			}

			// spawn miners
			if(!ctx.room.memory.ctx.flagSpawnMiners) {
				ctx.room.memory.ctx.minerNum = 2;
				ctx.room.memory.ctx.workerHarvesterNum = 1;

				ctx.room.memory.ctx.flagSpawnMiners = true;
				ctx.room.memory.ctx.flagSpawningMiners = true;
			}
			// check if finished
			if(ctx.room.memory.ctx.flagSpawningMiners) {
				if(ctx.miners.length >= ctx.room.memory.ctx.minerNum) {
					ctx.room.memory.ctx.workerHarvesterNum = 0;

					ctx.room.memory.ctx.flagSpawningMiners = false;
				} else {
					return false;
				}
			}

			return true;
		},
		terminate: function(ctx, next) {
			delete ctx.room.memory.ctx.flagDevRoles;
			delete ctx.room.memory.ctx.flagSpawnCarriers;
			delete ctx.room.memory.ctx.flagSpawningCarriers;
			delete ctx.room.memory.ctx.flagSpawnMiners;
			delete ctx.room.memory.ctx.flagSpawningMiners;
			defaultTerminate(ctx, next);
		}
	},
	statRoad3: {
		wait: 1,
		next: ['road3'],
		init: defaultInit,
		loop: function(ctx) {
			if(!ctx.room.memory.ctx.flagStatRoad3Start) {
				ctx.room.memory.ctx.flagStatRoad3Start = Game.time;
			}
			if(ctx.room.memory.ctx.statsRoad == undefined) {
				ctx.room.memory.ctx.statsRoad = [];
			}
			var creeps = ctx.room.find(FIND_CREEPS, {
				filter: (creep) => {
					return creep.my;
				}
			});
			var creepPos = creeps.map((creep) => creep.pos);
			for(var i in creepPos) {
				if(!utils.IsItemInList(creepPos[i], ctx.room.memory.ctx.statsRoad, utils.IsSamePosition)) {
					ctx.room.memory.ctx.statsRoad.push(creepPos[i]);
				}
			}
			return Game.time - ctx.room.memory.ctx.flagStatRoad3Start > 500;
		},
		terminate: function(ctx, next) {
			delete ctx.room.memory.ctx.flagStatRoad3Start;
			defaultTerminate(ctx, next);
		}
	},
	road3: {
		wait: 1,
		next: ['upgrade4'],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			for(var i in ctx.room.memory.ctx.statsRoad) {
				var pos = ctx.room.memory.ctx.statsRoad[i];
				ctx.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
			}
			delete ctx.room.memory.ctx.statsRoad;

			ctx.room.memory.ctx.workerUpgraderNum = 1;
			ctx.room.memory.ctx.workerBuilderNum = 3;

			ctx.room.memory.ctx.flagRoad3 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagRoad3')) {
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
			delete ctx.room.memory.ctx.flagRoad3;
			defaultTerminate(ctx, next);
		}
	},
	tower3: {
		wait: 1,
		next: ['upgrade4'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerBuilderNum = 2;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, rem = 1 - ctx.towers.length;

			for(var dist = 1; rem > 0; dist++) {
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
			        room.createConstructionSite(pos, STRUCTURE_TOWER);
			    });
			}
		},
		loop: function(ctx) {
			return ctx.towers.length >= 1;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerBuilderNum = 0;
			ctx.room.memory.ctx.workerRepairerNum = 1;
			defaultTerminate(ctx, next);
		}
	},
	upgrade4: {
		wait: 2,
		next: ['extension4'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerUpgraderNum = 3;
			ctx.room.memory.ctx.workerBuilderNum = 0;
		},
		loop: function(ctx) {
			return ctx.room.controller.level >= 4;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerUpgraderNum = 1;
			defaultTerminate(ctx, next);
		}
	},
	extension4: {
		wait: 1,
		next: ['storage'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerBuilderNum = 2;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.my && structure.structureType == STRUCTURE_EXTENSION;
				}
			}).length;

			var room = ctx.room, spawn = ctx.spawn, rem = 20 - exts;

			for(var dist = 3; rem > 0; dist++) {
				// TODO: get positions by range
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

			ctx.room.memory.ctx.flagExtension4 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagExtension4')) {
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
			ctx.room.memory.ctx.workerBuilderNum = 0;
			delete ctx.room.memory.ctx.flagExtension4;
			defaultTerminate(ctx, next);
		}
	},
	storage: {
		wait: 1,
		next: ['upgrade5'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerBuilderNum = 2;
			ctx.room.memory.ctx.workerUpgraderNum = 1;

			var room = ctx.room, spawn = ctx.spawn, rem = 1;
			if(ctx.storage != undefined) rem = 0;

			for(var dist = 1; rem > 0; dist++) {
				// TODO: get positions by range
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
			        room.createConstructionSite(pos.x, pos.y, STRUCTURE_STORAGE);
			    });
			}
		},
		loop: function(ctx) {
			return ctx.storage != undefined;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerBuilderNum = 0;
			defaultTerminate(ctx, next);
		}
	},
	upgrade5: {
		wait: 1,
		next: ['tower5'],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			ctx.room.memory.ctx.workerUpgraderNum = 2;
		},
		loop: function(ctx) {
			return ctx.room.controller.level >= 5;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerUpgraderNum = 1;
			defaultTerminate(ctx, next);
		}
	},
	tower5: {
		wait: 1,
		next: ['extension5'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerBuilderNum = 2;

			var room = ctx.room, spawn = ctx.spawn, rem = 2 - ctx.towers.length;

			for(var dist = 1; rem > 0; dist++) {
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
			        room.createConstructionSite(pos, STRUCTURE_TOWER);
			    });
			}
		},
		loop: function(ctx) {
			return ctx.towers.length >= 2;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerBuilderNum = 0;
			defaultTerminate(ctx, next);
		}
	},
	extension5: {
		wait: 1,
		next: ['upgrade6'],
		init: function(ctx, next) {
			defaultInit(ctx, next);

			ctx.room.memory.ctx.workerBuilderNum = 2;

			var exts = ctx.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return structure.my && structure.structureType == STRUCTURE_EXTENSION;
				}
			}).length;

			var room = ctx.room, spawn = ctx.spawn, rem = 30 - exts;

			for(var dist = 3; rem > 0; dist++) {
				// TODO: get positions by range
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

			ctx.room.memory.ctx.flagExtension5 = 0;
		},
		loop: function(ctx) {
			if(!checkBuildFlag(ctx, 'flagExtension5')) {
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
			ctx.room.memory.ctx.workerBuilderNum = 0;
			delete ctx.room.memory.ctx.flagExtension5;
			defaultTerminate(ctx, next);
		}
	},
	upgrade6: {
		wait: 1,
		next: [],
		init: function(ctx, next) {
			defaultInit(ctx, next);
			ctx.room.memory.ctx.workerUpgraderNum = 3;
		},
		loop: function(ctx) {
			return ctx.room.controller.level >= 6;
		},
		terminate: function(ctx, next) {
			ctx.room.memory.ctx.workerUpgraderNum = 1;
			defaultTerminate(ctx, next);
		}
	},
	wallAndRam: {
		wait: 1,
		next: [],
		init: defaultInit,
		loop: function(ctx) {
			return true;
		},
		terminate: defaultTerminate
	}
};

module.exports = {
	startStage,
    stages
};