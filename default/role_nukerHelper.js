var utils = require('utils');

var helperParts = utils.GetPartsByArray([[CARRY, 20], [MOVE, 10]]);

function GetPartsAndCost(energy) {
	if(energy < 1500) {
		return {cost: 0, parts: []};
	}
	return {cost: 1500, parts: helperParts};
}

function runLookAround(ctx, creep, extra = 0) {
	creep.memory.state = 'lookAround';
	if(ctx.nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > extra && ctx.terminal && ctx.terminal.store[RESOURCE_GHODIUM] > 0) {
		creep.memory.resourceType = RESOURCE_GHODIUM;
		return runWithdraw(ctx, creep);
	}
	if(ctx.nuker.store.getFreeCapacity(RESOURCE_ENERGY) > extra && ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 10000) {
		creep.memory.resourceType = RESOURCE_ENERGY;
		return runWithdraw(ctx, creep);
	}
	return 0;
}

function runWithdraw(ctx, creep) {
	creep.memory.state = 'withdraw';
	if(creep.memory.resourceType == RESOURCE_GHODIUM) {
		if(!creep.pos.isNearTo(ctx.terminal)) {
			return utils.DefaultMoveTo(creep, ctx.terminal);
		}
		var err = creep.withdraw(ctx.terminal, RESOURCE_GHODIUM);
		if(err == 0) {
			return runTransfer(ctx, creep);
		}
	} else {
		if(!creep.pos.isNearTo(ctx.storage)) {
			return utils.DefaultMoveTo(creep, ctx.storage);
		}
		var err = creep.withdraw(ctx.storage, RESOURCE_ENERGY);
		if(err == 0) {
			return runTransfer(ctx, creep);
		}
	}
}

function runTransfer(ctx, creep) {
	creep.memory.state = 'transfer';
	if(!creep.pos.isNearTo(ctx.nuker)) {
		return utils.DefaultMoveTo(creep, ctx.nuker);
	}
	var resourceType = creep.memory.resourceType;
	var err = creep.transfer(ctx.nuker, resourceType);
	if(err == 0) {
		return runLookAround(ctx, creep, creep.store[resourceType]);
	}
}

function Run(ctx, creep) {
	ctx.nuker = Game.getObjectById(creep.memory.nukerId);
	if(creep.memory.state == undefined) {
		return runLookAround(ctx, creep);
	}
	switch(creep.memory.state) {
	case 'lookAround': {
		return runLookAround(ctx, creep);
	}
	case 'withdraw': {
		return runWithdraw(ctx, creep);
	}
	case 'transfer': {
		return runTransfer(ctx, creep);
	}
	}
}

module.exports = {
	GetPartsAndCost,
	Run
};