var utils = require('utils');

var roleParts = {
	0: [],
	1150: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
};

function getCost(energy) {
	if(energy >= 1150) return 1150;
	return 0;
}

function GetPartsAndCost(energy) {
	var cost = getCost(energy);
	var parts = roleParts[cost];
	return {cost: cost, parts: parts};
}

var buffer = {};

function Run(ctx, creep) {
	var outSources = require('room_config').E29N34.outSources;
	// been attacked
	if(creep.hits < creep.hitsMax) {
		creep.memory.sleep = 100;
		var pos = new RoomPosition(25, 25, creep.memory.ctrlRoom);
		return utils.DefaultMoveTo(creep, pos);
	}
	// sleep after attacked
	if(creep.memory.sleep != undefined && creep.memory.sleep > 0) {
		creep.memory.sleep -= 1;
		return -555;
	}
	// go to work room
	var idx = creep.memory.sourceIdx;
	var workPos = utils.GetRoomPosition(outSources[creep.memory.workRoom].workPos[idx]);
	if(creep.room.name != creep.memory.workRoom) {
		return utils.DefaultMoveTo(creep, workPos);
	}
	// build road or container
	if(creep.memory.work && creep.store[RESOURCE_ENERGY] > 0) {
		if(Game.rooms[creep.memory.workRoom].ctx.constructing.length > 0) {
			return require('role_builder').Try2Build(Game.rooms[creep.memory.workRoom].ctx, creep);
		}
	} else {
		creep.memory.work = false;
	}
	// go to work pos
	if(!utils.IsSamePosition(creep.pos, workPos)) {
		return utils.DefaultMoveTo(creep, workPos);
	}
	// create container if not exist
	var container = Game.rooms[creep.memory.workRoom].ctx.room.lookAt(creep.pos).filter((item) => {
		return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
	});
	if(container.length == 0) {
		Game.rooms[creep.memory.workRoom].ctx.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
	}
	// create road if not exist
	var flag = false;
	var path = buffer[creep.id];
	if(path == undefined) {
		path = utils.FindPath(creep.pos, {pos: Game.rooms[creep.memory.ctrlRoom].storage.pos, range: 1}).path;
		path = path.filter((pos) => pos.roomName == creep.memory.workRoom);
		buffer[creep.id] = path;
		flag = true;
	}
	if(flag) {
		for(var i in path) {
			Game.rooms[path[i].roomName].createConstructionSite(path[i], STRUCTURE_ROAD);
		}
	}
	// harvest
	var source = Game.getObjectById(outSources[creep.memory.workRoom].sources[idx]);
	if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 16 && source.energy > 0) {
		creep.memory.work = false;
		return creep.harvest(source);
	} else {
		creep.memory.work = true;
	}
	// build or harvest
	if(creep.memory.work && creep.store[RESOURCE_ENERGY] > 0) {
		return require('role_repairer').Try2Repair(Game.rooms[creep.memory.workRoom].ctx, creep);
	} else {
		creep.memory.work = false;
	}

	if(source.amount == 0) return -233;
	return creep.harvest(source);
}

module.exports = {
	GetPartsAndCost,
    Run
};