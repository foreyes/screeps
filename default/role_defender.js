var utils = require('utils');

var roleParts = {
	0: [],
	1150: utils.GetPartsByArray([[MOVE, 3], [RANGED_ATTACK, 5], [HEAL, 1]]),
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

function Run(ctx, creep) {
	var outSource = require('room_config')[creep.memory.ctrlRoom].outSources[creep.memory.workRoom];
	// go to work room
	var workPos = utils.GetRoomPosition(outSource.workPos[0]);
	if(creep.room.name != creep.memory.workRoom) {
		return utils.DefaultMoveTo(creep, workPos);
	}
	// heal
	if(creep.hits < creep.hitsMax) {
		creep.heal(creep);
	}
	// range attack
	if(creep.room.ctx.enemies != undefined && creep.room.ctx.enemies.length > 0) {
		var target = creep.pos.findClosestByPath(creep.room.ctx.enemies);
		if(creep.rangedAttack(target) == ERR_NOT_IN_RANGE) {
			return utils.DefaultMoveTo(creep, target);
		}
	}
	var hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
	if(hostileStructures.length > 0) {
		var target = creep.pos.findClosestByPath(hostileStructures);
		if(creep.rangedAttack(target) == ERR_NOT_IN_RANGE) {
			return utils.DefaultMoveTo(creep, target);
		}
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};