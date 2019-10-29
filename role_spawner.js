var utils = require('utils');

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄 find energy');
    }
    utils.GetEnergyFromStore(ctx, creep)
}

function getTarget(ctx, creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            var st = structure.structureType;
            var res = st == STRUCTURE_SPAWN || st == STRUCTURE_EXTENSION;
            res = res && structure.store[RESOURCE_ENERGY] < structure.store.getCapacity(RESOURCE_ENERGY);
            res = res && structure.my;
            return res;
        }
    });
    if(targets.length == 0) {
        return null;
    }
    return creep.pos.findClosestByPath(targets, {ignoreCreeps: true});
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
    utils.DefaultMoveTo(creep, ctx.restPos);
}

module.exports = {
    Run
};