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
	1300: utils.GetPartsByArray([[WORK, 10], [CARRY, 1], [MOVE, 5]]),
	1450: utils.GetPartsByArray([[WORK, 10], [CARRY, 4], [MOVE, 5]]),
	2900: utils.GetPartsByArray([[WORK, 20], [CARRY, 8], [MOVE, 10]]),
};

function getCost(energy) {
	if(energy >= 2900) return 2900;
	if(energy >= 1450) return 1450;
	if(energy >= 1300) return 1300;
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

const S_TO_WORK = 0, S_WORK = 1, S_SLEEP = 2;
const REGEN_SOURCE_SLOT = 15;

function runUpdateWorkParts(creep) {
	if(creep.memory.workPartsNum == undefined || Game.time % 101 < 2) {
		creep.memory.workPartsNum = creep.getActiveBodyparts(WORK);
		creep.memory.carryPartsNum = creep.getActiveBodyparts(CARRY);
		creep.memory.noThrough = true;
	}
}

function runToWork(ctx, creep, source) {
	creep.memory.state = S_TO_WORK;
	if(!ctx.sourceContainers || !ctx.sourceContainers[creep.memory.sourceIdx]) {
		if(!creep.pos.isNearTo(source)) {
			return utils.DefaultMoveTo(creep, source);
		}
	} else {
		var target = ctx.sourceContainers[creep.memory.sourceIdx];
		if(!creep.pos.isEqualTo(target)) {
			return utils.DefaultMoveTo(creep, target);
		}
	}
	return runWork(ctx, creep, source);
}

function fallAsleep(creep, source) {
	if(!source.effects || source.effects.length == 0) {
		creep.memory.sleepTime = source.ticksToRegeneration;
	} else {
		creep.memory.sleepTime = Math.min(source.ticksToRegeneration, REGEN_SOURCE_SLOT);
	}
	creep.memory.state = S_SLEEP;
}

function runWork(ctx, creep, source) {
	creep.memory.state = S_WORK;
	const harvestAmount = creep.memory.workPartsNum * 2;
	const harvestTwiceAmount = harvestAmount * 2;
	// harvest without carry part
	if(creep.memory.carryPartsNum == 0) {
		if(source.energy >= harvestAmount) {
			creep.harvest(source);
		}
		if(source.energy < harvestTwiceAmount) {
			fallAsleep(creep, source);
		}
		return;
	}
	// harvest with carry part
	if(creep.store.getFreeCapacity() >= harvestAmount) {
		if(source.energy >= harvestAmount) {
			creep.harvest(source);
		}
		if(creep.store.getFreeCapacity() >= harvestTwiceAmount && source.energy < harvestTwiceAmount) {
			fallAsleep(creep, source);
		}
		return;
	}
	// repair and transfer
	if(ctx.sourceContainers && ctx.sourceContainers[creep.memory.sourceIdx]) {
		var target = ctx.sourceContainers[creep.memory.sourceIdx];
		if(target.hits < target.hitsMax) {
			return creep.repair(target);
		}
	}
	if(ctx.centralLink && ctx.sourceLinks && ctx.sourceLinks[creep.memory.sourceIdx]) {
		var link = ctx.sourceLinks[creep.memory.sourceIdx];
		if(link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
			return creep.transfer(link, RESOURCE_ENERGY);
		}
	} else {
		return creep.harvest(source);
	}
}

function Run(ctx, creep) {
	runUpdateWorkParts(creep);
	if(creep.memory.state == S_SLEEP) {
		if(creep.memory.sleepTime <= 1) {
			creep.memory.state = S_WORK;
		} else {
			creep.memory.sleepTime -= 1;
			return creep.say('💤');
		}
	}

	var source = ctx.sources[creep.memory.sourceIdx];
	if(creep.memory.state == undefined) {
		creep.memory.state = S_TO_WORK;
	}

	switch(creep.memory.state) {
	case S_TO_WORK: {
		return runToWork(ctx, creep, source);
	}
	case S_WORK: {
		return runWork(ctx, creep, source);
	}
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};