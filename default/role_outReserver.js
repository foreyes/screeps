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
	var outSource = require('room_config')[creep.memory.ctrlRoom].outSources[creep.memory.workRoom];
	// been attacked
	if(creep.hits < creep.hitsMax) {
		var defender = Game.creeps['defender' + creep.memory.workRoom];
		if(!defender) {
			outSource.needDefender = true;
		}
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
	var reservePos = utils.GetRoomPosition(outSource.reservePos);
	if(!utils.IsSamePosition(creep.pos, reservePos)) {
		return utils.DefaultMoveTo(creep, reservePos);
	}
	// reserve
	var controller = Game.getObjectById(outSource.controller);
	return creep.reserveController(controller);
}

module.exports = {
	GetPartsAndCost,
    Run
};