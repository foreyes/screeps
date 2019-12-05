var utils = require('utils');

function InitRoomCtx(gCtx, room) {
	var roomName = room.name;
	if(Memory.rooms[roomName] != undefined) {
		delete Memory.rooms[roomName];
	}
	Memory.rooms[roomName] = {};

	if(room.memory.ctx != undefined) {
		delete room.memory.ctx;
	}
	room.memory.ctx = {Wait: [], Running: []};

	var spawns = room.find(FIND_STRUCTURES, {
		filter: (struct) => {
			return struct.structureType == STRUCTURE_SPAWN;
		}
	});
	room.memory.ctx.spawnIds = spawns.map((struct) => struct.id);
	room.memory.ctx.sourceIds = room.find(FIND_SOURCES).map((src) => src.id);
}

function FetchRoomCtx(gCtx, room) {
	// // ownership
	// var my = room.controller != undefined && room.controller.my;
	// var neutral = room.controller == undefined || room.controller.owner == 'None';
	// var hostile = !my && !neutral
	if(room.controller == undefined || !room.controller.my) {
		// utils.ProfileStage('Fetch room' + room.name + ' ctx: ');
		return {
			room: room,
			enemies: room.find(FIND_HOSTILE_CREEPS),
			constructing: room.find(FIND_MY_CONSTRUCTION_SITES),
		}
	}

	// spawns
	var spawn = undefined;
	var spawns = _.map(room.memory.ctx.spawnIds, Game.getObjectById);
	if(spawns.length > 0) {
		spawn = spawns[0];
	}
	spawns = room.find(FIND_MY_SPAWNS).filter((s) => {
		return s.isActive();
	});
	// sources
	var sources =  _.map(room.memory.ctx.sourceIds, Game.getObjectById);
	// creeps
	var creeps = _.filter(Game.creeps, (creep) => {
		return (!creep.memory.ctrlRoom && creep.room.name == room.name) || creep.memory.ctrlRoom == room.name;
	});
	// towers
	var towers = room.find(FIND_STRUCTURES, {
		filter: (structure) => {
			return structure.structureType == STRUCTURE_TOWER;
		}
	});
	// enemies
	var enemies = room.find(FIND_CREEPS, {
        filter: (creep) => {
            return !creep.my && creep.owner != 'zkl2333';
        }
    });
    // droped energy > 300
    var dropedEnergy = room.find(FIND_DROPPED_RESOURCES, {
		filter: (resource) => {
			return resource.amount >= 50 && resource.resourceType == RESOURCE_ENERGY;
		}
	});
	// storage
	var storage = room.storage;
	// constructing
	var constructing = room.find(FIND_CONSTRUCTION_SITES, {
		filter: (site) => {
			return site.my;
		}
	});
	// empty extension
	var emptyExts = room.find(FIND_STRUCTURES, {
		filter: (struct) => {
			var res = struct.structureType == STRUCTURE_EXTENSION || struct.structureType == STRUCTURE_SPAWN;
			return res && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
		}
	});
	// walls and ramparts
	var wallsAndRamparts = room.find(FIND_STRUCTURES, {
		filter: (s) => {
			return s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART;
		}
	});
	// creeps by role
	var upgraders = creeps.filter((creep) => creep.memory.role == 'upgrader');
	var builders = creeps.filter((creep) => creep.memory.role == 'builder');
	var repairers = creeps.filter((creep) => creep.memory.role == 'repairer');
	var miners = creeps.filter((creep) => creep.memory.role == 'miner');
	var fillers = creeps.filter((creep) => creep.memory.role == 'filler');
	fillers = fillers.sort((a, b) => {
		if(a.spawning) return true;
		if(b.spawning) return false;
		return a.id < b.id;
	});
	// setup restPos
	var restPos = spawn;
	if(room.memory.ctx.restPos != undefined) {
		var pos = room.memory.ctx.restPos;
		restPos = new RoomPosition(pos.x, pos.y, pos.roomName);
	}
	// mineral
	var mineral = undefined;
	var minerals = room.find(FIND_MINERALS);
	if(minerals.length > 0 && minerals[0].mineralAmount > 0) {
		mineral = minerals[0];
	}
	var mineralCanHarvest = undefined;
	if(mineral != undefined) {
		var extractor = room.lookAt(mineral.pos).filter((item) => {
			return item.type == 'structure' && item.structure.structureType == STRUCTURE_EXTRACTOR && item.structure.my;
		});
		if(extractor.length > 0) {
			mineralCanHarvest = mineral;
		}
	}
	// factory
	var factory = undefined;
	var factories = room.find(FIND_STRUCTURES, {
		filter: (s) => {
			return s.structureType == STRUCTURE_FACTORY;
		}
	});
	if(factories.length > 0) {
		factory = factories[0];
	}
	// factorier
	var factoriers = creeps.filter((creep) => creep.memory.role == 'specialer' && creep.memory.specialType == 'factorier');
	// labs
	var labs = undefined;
	if(room.memory.ctx.labIds) {
		labs = room.memory.ctx.labIds.map(Game.getObjectById);
	}
	// labers
	var labers = creeps.filter((creep) => creep.memory.role == 'specialer' && creep.memory.specialType == 'laber');
	// stealers
	// var stealers = room.find(FIND_CREEPS, {
 //    	filter: (creep) => {
 //        	return creep.my && creep.memory.role == 'specialer' && creep.memory.specialType == 'stealer';
 //    	}
 //   	});
 	// power spawn
 	var powerSpawn = undefined;
 	var powerSpawns = room.find(FIND_STRUCTURES, {
 		filter: (s) => {
 			return s.structureType == STRUCTURE_POWER_SPAWN;
 		}
 	});
 	if(powerSpawns.length > 0) {
 		powerSpawn = powerSpawns[0];
 	}
 	var powerSpawners = creeps.filter((creep) => creep.memory.role == 'specialer' && creep.memory.specialType == 'powerSpawner');

	var ctx = {
		room: room,
		// my: my,
		// neutral: neutral,
		// hostile: hostile,
		spawns: spawns,
		spawn: spawn,
		sources: sources,
		// outCreeps: outCreeps,
		// ownCreeps: ownCreeps,
		creeps: creeps,
		towers: towers,
		enemies: enemies,
		restPos: restPos,
		dropedEnergy: dropedEnergy,
		storage: storage,
		terminal: room.terminal,
		constructing: constructing,
		emptyExts: emptyExts,
		wallsAndRamparts: wallsAndRamparts,
		upgraders: upgraders,
		builders: builders,
		repairers: repairers,
		miners: miners,
		fillers: fillers,
		keepLevel: room.memory.ctx.keepLevel == true,
		upgrading: room.memory.ctx.upgrading == true,
		restPos: restPos,
		mineral: mineral,
		mineralCanHarvest: mineralCanHarvest,
		factory: factory,
		factoriers: factoriers,
		labs: labs,
		labers: labers,
		powerSpawn: powerSpawn,
		powerSpawners: powerSpawners,
		// stealers: stealers,
	};
	// set room ignore
	if(ctx.spawn) {
		ctx.roomIgnore = [new RoomPosition(ctx.spawn.pos.x, ctx.spawn.pos.y-1, room.name)];
	}

	// set container info
	if(room.memory.ctx.controllerContainerPos != undefined) {
		var pos = room.memory.ctx.controllerContainerPos;
		pos = new RoomPosition(pos.x, pos.y, pos.roomName);
		var containers = room.lookAt(pos).filter((item) => {
			return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
		});
		if(containers.length != 0) {
			room.memory.ctx.controllerContainerId = containers[0].structure.id;
			delete room.memory.ctx.controllerContainerPos;
		}
	}
	if(room.memory.ctx.sourceContainerPos != undefined) {
		for(var i in room.memory.ctx.sourceContainerPos) {
			var pos = room.memory.ctx.sourceContainerPos[i];
			pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			var containers = room.lookAt(pos).filter((item) => {
				return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
			});
			if(containers.length != 0) {
				room.memory.ctx.sourceContainerIds[i] = containers[0].structure.id;
				delete room.memory.ctx.sourceContainerPos[i];
			}
		}
		if(utils.IsEmptyObj(room.memory.ctx.sourceContainerPos)) {
			delete room.memory.ctx.sourceContainerPos;
		}
	}
	if(room.memory.ctx.centralContainerPos != undefined) {
		for(var i in room.memory.ctx.centralContainerPos) {
			var pos = room.memory.ctx.centralContainerPos[i];
			pos = new RoomPosition(pos.x, pos.y, pos.roomName);
			var containers = room.lookAt(pos).filter((item) => {
				return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
			});
			if(containers.length != 0) {
				room.memory.ctx.centralContainerIds[i] = containers[0].structure.id;
				delete room.memory.ctx.centralContainerPos[i];
			}
		}
		if(utils.IsEmptyObj(room.memory.ctx.centralContainerPos)) {
			delete room.memory.ctx.centralContainerPos;
		}
	}
	// get container
	if(room.memory.ctx.controllerContainerId) {
		var obj = Game.getObjectById(room.memory.ctx.controllerContainerId);
		if(obj) {
			ctx.controllerContainer = obj;
		}
	}
	if(room.memory.ctx.sourceContainerIds) {
		ctx.sourceContainers = utils.ObjMap(room.memory.ctx.sourceContainerIds, Game.getObjectById);
	}
	if(room.memory.ctx.centralContainerIds) {
		var centralContainerIds = _.filter(room.memory.ctx.centralContainerIds, (id) => Game.getObjectById(id) != null);
		ctx.centralContainers = centralContainerIds.map(Game.getObjectById);
	}
	// get link
	if(room.memory.ctx.sourceLinkIds) {
		ctx.sourceLinks = utils.ObjMap(room.memory.ctx.sourceLinkIds, Game.getObjectById);
	}
	if(room.memory.ctx.centralLinkId) {
		ctx.centralLink = Game.getObjectById(room.memory.ctx.centralLinkId);
	}
	if(room.memory.ctx.controllerLinkId) {
		ctx.controllerLink = Game.getObjectById(room.memory.ctx.controllerLinkId);
	}

	ctx.creepOnContainer = ctx.controllerContainer && 
							ctx.room.lookAt(ctx.controllerContainer.pos).filter((item) => {
								return item.type == 'creep';
							}).length > 0;

	room.ctx = ctx;

	// utils.ProfileStage('Fetch room' + room.name + ' ctx: ');
	return ctx;
}

module.exports = {
	InitRoomCtx,
	FetchRoomCtx,
};