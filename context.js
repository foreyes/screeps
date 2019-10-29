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
	var sources = room.memory.ctx.sourceIds.map(Game.getObjectById);
	// creeps
	var ctrlCreeps = _.filter(Game.creeps, (creep) => {
		return creep.ctrlRoom == room.name;
	});
	var ownCreeps = _.filter(Game.creeps, (creep) => {
		return creep.ownRoom == room.name;
	});
	var creeps = _.filter(Game.creeps, (creep) => {
		return creep.room.name == room.name;
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
			return resource.amount >= 300 && resource.resourceType == RESOURCE_ENERGY;
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
	var workerHarvesters = utils.GetMyCreepsByRole(room, 'workerHarvester');
	var workerUpgraders = utils.GetMyCreepsByRole(room, 'workerUpgrader');
	var workerBuilders = utils.GetMyCreepsByRole(room, 'workerBuilder');
	var workerRepairers = utils.GetMyCreepsByRole(room, 'workerRepairer');
	var miners = utils.GetMyCreepsByRole(room, 'miner');
	var workerCarriers = utils.GetMyCreepsByRole(room, 'spawner').concat(utils.GetMyCreepsByRole(room, 'carrier'));
	var spawners = [], carriers = [];
	// carrier role change
	if(emptyExts.length > 0) {
		for(var i in workerCarriers) {
			workerCarriers[i].memory.role = 'spawner';
		}
		spawners = workerCarriers;
	} else {
		for(var i in workerCarriers) {
			workerCarriers[i].memory.role = 'carrier';
		}
		carriers = workerCarriers;
	}

	var ctx = {
		room: room,
		my: my,
		neutral: neutral,
		hostile: hostile,
		spawns: spawns,
		spawn: spawn,
		sources: sources,
		ctrlCreeps: ctrlCreeps,
		ownCreeps: ownCreeps,
		creeps: creeps,
		towers: towers,
		enemies: enemies,
		restPos: restPos,
		dropedEnergy: dropedEnergy,
		storage: storage,
		constructing: constructing,
		emptyExts: emptyExts,
		workerHarvesters: workerHarvesters,
		workerUpgraders: workerUpgraders,
		workerBuilders: workerBuilders,
		workerRepairers: workerRepairers,
		spawners: spawners,
		carriers: carriers,
		miners: miners,
	};

	if(room.memory.ctx.flagSetContainerInfo) {
		ctx.flagDevRole = true;
		var sourceContainerIds = [room.memory.ctx.sourceContainerIds[0], room.memory.ctx.sourceContainerIds[1], room.memory.ctx.spawnContainerId];
		ctx.sourceContainers = sourceContainerIds.map(Game.getObjectById);
		ctx.controllerContainer = Game.getObjectById(room.memory.ctx.controllerContainerId);
	}
	return ctx;
}

module.exports = {
	InitRoomCtx,
	FetchRoomCtx,
};

