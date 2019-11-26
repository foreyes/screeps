var utils = require('utils');

var roleParts = {
	0: [],
	1300: [CLAIM, CLAIM, MOVE, MOVE],
};

function getCost(energy) {
	if(energy >= 1300) return 1300;
	return 0;
}

function GetPartsAndCost(energy) {
	var cost = getCost(energy);
	var parts = roleParts[cost];
	return {cost: cost, parts: parts};
}

var bufferPath = {};

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
	// go to reserve pos
	if(creep.memory.startPosStr == undefined) {
		creep.memory.startPosStr = creep.pos.roomName + creep.pos.x + creep.pos.y;
	}
	var reservePos = utils.GetRoomPosition(outSources[creep.memory.workRoom].reservePos);
	if(!utils.IsSamePosition(creep.pos, reservePos)) {
		if(creep.room.name != creep.memory.workRoom) {
			if(bufferPath[creep.memory.startPosStr] == undefined) {
				bufferPath[creep.memory.startPosStr] = utils.FindPath(creep.pos, reservePos).path;
			}
			return creep.moveByPath(bufferPath[creep.memory.startPosStr]);
		} else {
			return utils.DefaultMoveTo(creep, reservePos);
		}
	}
	// reserve
	var controller = Game.getObjectById(outSources[creep.memory.workRoom].controller);
	return creep.reserveController(controller);
}

module.exports = {
	GetPartsAndCost,
    Run
};