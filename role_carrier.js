var utils = require('utils');

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄 find energy');
    }
    utils.GetEnergyFromStore(ctx, creep)
}

function getStorePriority(structure) {
    var st = structure.structureType;
    if(st == STRUCTURE_TOWER) return 0;
    if(st == STRUCTURE_CONTAINER) return 1;
    if(st == STRUCTURE_STORAGE) return 2;
    return 3;
}

function cmpByStorePriority(a, b) {
    return getStorePriority(a) > getStorePriority(b);
}

function getTarget(ctx, creep) {
	if(ctx.controllerContainer.store[RESOURCE_ENERGY] < ctx.controllerContainer.store.getCapacity(RESOURCE_ENERGY)) {
		return ctx.controllerContainer;
	}
	var targets = creep.room.find(FIND_STRUCTURES, {
		filter: (structure) => {
			var st = structure.structureType;
			var res = st == STRUCTURE_TOWER || st == STRUCTURE_CONTAINER || st == STRUCTURE_STORAGE;
			res = res && structure.id != ctx.sourceContainers[0].sid && structure.id != ctx.sourceContainers[1].id;
			res = res && structure.store[RESOURCE_ENERGY] < structure.store.getCapacity(RESOURCE_ENERGY);
			if(structure.my != undefined) {
				res = res && structure.my;
			}
			return res;
		}
	});
	if(targets.length == 0) {
		return null;
	}
	targets = targets.sort(cmpByStorePriority);
	return targets[0];
}

function transfer2Store(ctx, creep) {
	var target = getTarget(ctx, creep);
	if(!target) return false;

    var err = creep.transfer(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, target);
    }
    return true;
}

function Run(ctx, creep) {
    if(creep.memory.FindEnergy && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
        creep.memory.FindEnergy = false;
        creep.say('store');
    }
    if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.FindEnergy) {
        findEnergy(ctx, creep);
        return;
    }
    if(transfer2Store(ctx, creep)) {
        return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.spawn);
}

module.exports = {
    Run
};