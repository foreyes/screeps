var utils = require('utils');

var roleParts = {
	0: [],
	250: [WORK, WORK, MOVE],
	350: [WORK, WORK, WORK, MOVE],
	450: [WORK, WORK, WORK, WORK, MOVE],
	550: [WORK, WORK, WORK, WORK, WORK, MOVE],
	600: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE],
	650: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
	750: [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
	1250: utils.GetPartsByArray([[WORK, 10], [MOVE, 5]]),
	1400: utils.GetPartsByArray([[WORK, 10], [CARRY, 4], [MOVE, 4]]),
};

function getCost(energy) {
	if(energy >= 1400) return 1400;
	if(energy >= 1250) return 1250;
	if(energy >= 750) return 750;
	if(energy >= 650) return 650;
	if(energy >= 550) return 550;
	if(energy >= 450) return 450;
	if(energy >= 350) return 350;
	if(energy >= 250) return 250;
	return 0;
}

function GetPartsAndCost(energy) {
	var cost = getCost(energy);
	var parts = roleParts[cost];
	return {cost: cost, parts: parts};
}

function Run(ctx, creep) {
	if(creep.memory.workPartsNum == undefined) {
		creep.memory.workPartsNum = creep.getActiveBodyparts(WORK);
	}
	var source = ctx.sources[creep.memory.sourceIdx];
	if(!ctx.sourceContainers || !ctx.sourceContainers[creep.memory.sourceIdx]) {
		var err = creep.harvest(source);
		if(err != 0) {
			utils.DefaultMoveTo(creep, source);
		}
		return;
	}

	var target = ctx.sourceContainers[creep.memory.sourceIdx];
	if(!creep.pos.isEqualTo(target.pos)) {
		return utils.DefaultMoveTo(creep, target.pos);
	}
	if(creep.store && creep.store[RESOURCE_ENERGY] > 0 && target.hits < target.hitsMax) {
		return creep.repair(target);
	}
	if(ctx.centralLink && ctx.sourceLinks && ctx.sourceLinks[creep.memory.sourceIdx] && ctx.sourceLinks[creep.memory.sourceIdx].store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.getActiveBodyparts(CARRY) > 0) {
		var works = creep.getActiveBodyparts(WORK);
		if(creep.store.getFreeCapacity(RESOURCE_ENERGY) >= works * 2) {
			creep.harvest(source);
		} else {
			creep.transfer(ctx.sourceLinks[creep.memory.sourceIdx], RESOURCE_ENERGY);
		}
	} else {
		creep.harvest(source);
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};