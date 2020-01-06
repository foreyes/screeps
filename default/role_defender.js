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

function getNewTarget(ctx, creep) {
	if(creep.room.ctx.enemies != undefined && creep.room.ctx.enemies.length > 0) {
		return creep.pos.findClosestByPath(creep.room.ctx.enemies);
	}
	var hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
	if(hostileStructures.length > 0) {
		return creep.pos.findClosestByPath(hostileStructures);
	}
	return null;
}

function Run(ctx, creep) {
	if(creep.hits == creep.hitsMax && creep.memory.sleep != undefined) {
		creep.memory.sleep -= 1;
		if(creep.memory.sleep == 0) {
			delete creep.memory.sleep;
		}
		return;
	}
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
	var target = Game.getObjectById(creep.memory.targetId);
	if(!target) {
		target = getNewTarget(ctx, creep);
		if(!target) {
			creep.memory.sleep = 10;
			return;
		}
		creep.memory.targetId = target.id;
	}
	var err = creep.rangedAttack(target);
	if(err == ERR_NOT_IN_RANGE) {
		return utils.DefaultMoveTo(creep, target);
	}
	return err;
}

module.exports = {
	GetPartsAndCost,
    Run
};