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
	// ownership
	var my = room.controller != undefined && room.controller.my;
	var neutral = room.controller == undefined || room.controller.owner == 'None';
	var hostile = !my && !neutral
	// spawns
	var spawns = room.memory.ctx.spawnIds.map(Game.getObjectById);
	var spawn = undefined;
	if(spawns.length > 0) {
		spawn = spawns[0];
	}
	// sources
	var sources = {};
	for(var i in room.memory.ctx.sourceIds) {
		sources[i] = Game.getObjectById(room.memory.ctx.sourceIds[i]);
	}
	// creeps
	var outCreeps = _.filter(Game.creeps, (creep) => {
		return creep.memory.ctrlRoom == room.name && creep.room.name != room.name;
	});
	var ownCreeps = _.filter(Game.creeps, (creep) => {
		return creep.memory.ownRoom == room.name;
	});
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
    // restPos
    var restPos = spawn;
    // droped energy > 300
    var dropedEnergy = room.find(FIND_DROPPED_RESOURCES, {
		filter: (resource) => {
			return resource.amount >= 50 && resource.resourceType == RESOURCE_ENERGY;
		}
	});
	// storage
	var storage = room.storage;
	// constructing
	var constructing = room.find(FIND_CONSTRUCTION_SITES);
	// empty extension
	var emptyExts = room.find(FIND_STRUCTURES, {
		filter: (struct) => {
			var res = struct.structureType == STRUCTURE_EXTENSION || struct.structureType == STRUCTURE_SPAWN;
			return res && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
		}
	});
	// creeps by role
	var upgraders = utils.GetMyCreepsByRole(room, 'upgrader');
	var builders = utils.GetMyCreepsByRole(room, 'builder');
	var repairers = utils.GetMyCreepsByRole(room, 'repairer');
	var miners = utils.GetMyCreepsByRole(room, 'miner');
	var fillers = utils.GetMyCreepsByRole(room, 'filler');

	var ctx = {
		room: room,
		my: my,
		neutral: neutral,
		hostile: hostile,
		spawns: spawns,
		spawn: spawn,
		sources: sources,
		outCreeps: outCreeps,
		ownCreeps: ownCreeps,
		creeps: creeps,
		towers: towers,
		enemies: enemies,
		restPos: restPos,
		dropedEnergy: dropedEnergy,
		storage: storage,
		constructing: constructing,
		emptyExts: emptyExts,
		upgraders: upgraders,
		builders: builders,
		repairers: repairers,
		miners: miners,
		fillers: fillers,
		keepLevel: room.memory.ctx.keepLevel == true,
	};

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
		ctx.controllerContainer = Game.getObjectById(room.memory.ctx.controllerContainerId);
	}
	if(room.memory.ctx.sourceContainerIds) {
		ctx.sourceContainers = utils.ObjMap(room.memory.ctx.sourceContainerIds, Game.getObjectById);
	}
	if(room.memory.ctx.centralContainerIds) {
		ctx.centralContainers = utils.ObjMap(room.memory.ctx.centralContainerIds, Game.getObjectById);
	}

	room.ctx = ctx;
	return ctx;
}

module.exports = {
	InitRoomCtx,
	FetchRoomCtx,
};