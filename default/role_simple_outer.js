var utils = require('utils');

function getCost(energy) {
	return Math.min(parseInt(energy / 200), 15) * 200;
}

function GetPartsAndCost(energy) {
	if(energy >= 1200 && energy < 1400) {
		return {cost: 1200, parts: utils.GetPartsByArray([[WORK, 3], [CARRY, 11], [MOVE, 7]])};
	}
    var cost = getCost(energy);
    var cnt = parseInt(cost / 200);
    var parts = utils.GetPartsByArray([[WORK, cnt], [CARRY, cnt], [MOVE, cnt]]);
    return {cost: cost, parts: parts};
}

function Run(ctx, creep) {
	if(creep.memory.cost == undefined) {
		creep.memory.cost = creep.getActiveBodyparts(WORK) * 100;
		creep.memory.cost += (creep.getActiveBodyparts(CARRY) + creep.getActiveBodyparts(MOVE)) * 50;
	}

	var flagName = creep.memory.flagName;
	ctx.room.memory.tmp[flagName] = creep.id;

	if(creep.hits < creep.hitsMax) {
		return utils.DefaultMoveTo(creep, ctx.spawn);
	}

	if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		var pos1 = creep.pos, pos2 = Game.flags[creep.memory.flagName].pos;
		if(pos1.roomName != pos2.roomName || utils.GetDirectDistance(pos1, pos2) > 1) {
			utils.DefaultMoveTo(creep, pos2);
			return;
		}
		creep.say('hi');
		var target = creep.room.lookAt(pos2).filter(
			(item) => {
				return item.type == 'source';
			}
		);
		target = target[0].source;
		creep.harvest(target);
		return;
	} else {
		var target = ctx.room.storage;
		var err = creep.transfer(target, RESOURCE_ENERGY);
		if(err == ERR_NOT_IN_RANGE) {
			return utils.DefaultMoveTo(creep, target);
		} else if(err == 0) {
			if(creep.memory.cnt == undefined) {
				creep.memory.cnt = 0;
			}
			creep.memory.cnt += creep.store.getCapacity(RESOURCE_ENERGY);
		}
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};