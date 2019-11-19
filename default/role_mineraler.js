var utils = require('utils');

function getCost(energy) {
	return Math.min(parseInt(energy / 450), 8) * 450;
}

function GetPartsAndCost(energy) {
    var cost = getCost(energy);
    var cnt = parseInt(cost / 450);
    var parts = utils.GetPartsByArray([[WORK, cnt*3], [CARRY, cnt], [MOVE, cnt*2]]);
    return {cost: cost, parts: parts};
}

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄');
    }

    var source = ctx.mineralCanHarvest;
    if(!source) return;

    creep.memory.resourceType = source.mineralType;
    var err = creep.harvest(source);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, source);
    }
}

function Run(ctx, creep) {
	if(ctx.mineralCanHarvest && creep.ticksToLive > 70) {
		creep.memory.resourceType = ctx.mineralCanHarvest.mineralType;
		if(creep.memory.FindEnergy && creep.store.getFreeCapacity(creep.memory.resourceType) == 0) {
	        creep.memory.FindEnergy = false;
	    }
	    if(creep.store.getUsedCapacity(creep.memory.resourceType) == 0 || creep.memory.FindEnergy) {
	        findEnergy(ctx, creep);
	        return;
	    }
	}

    if(ctx.terminal != undefined && ctx.terminal.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    	var target = ctx.terminal;
    	var err = creep.transfer(target, creep.memory.resourceType);
    	if(err == ERR_NOT_IN_RANGE) {
        	return utils.DefaultMoveTo(creep, target);
    	}
    } else if(ctx.storage != undefined && ctx.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        var target = ctx.storage;
        var err = creep.transfer(target, creep.memory.resourceType);
        if(err == ERR_NOT_IN_RANGE) {
            return utils.DefaultMoveTo(creep, target);
        }
    }

    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.restPos);
}

module.exports = {
    GetPartsAndCost,
    Run
};