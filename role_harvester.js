var utils = require('utils');

function harvestEnergy(ctx, creep) {
    if(!creep.memory.harvesting) {
        creep.memory.harvesting = true;
        creep.say('🔄 harvest');
    }
    // TODO: get from container.
    // TODO: plan it
    var source = ctx.sources[1];
    var err = creep.harvest(source);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, source);
    }
}

function getStorePriority(structure) {
    var st = structure.structureType;
    if(st == STRUCTURE_EXTENSION) return 0;
    if(st == STRUCTURE_SPAWN) return 1;
    if(st == STRUCTURE_TOWER) return 2;
    // TODO: plan container store
    if(st == STRUCTURE_CONTAINER) return 3;
    return 4;
}

function cmpByStorePriority(a, b) {
    return getStorePriority(a) > getStorePriority(b);
}

function transfer2Store(ctx, creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            var st = structure.structureType;
            var res = st == STRUCTURE_SPAWN || st == STRUCTURE_EXTENSION || st == STRUCTURE_CONTAINER || st == STRUCTURE_TOWER;
            res = res && structure.store[RESOURCE_ENERGY] < structure.store.getCapacity(RESOURCE_ENERGY);
            if(structure.my != undefined) {
                res = res && structure.my;
            }
            return res;
        }
    });
    if(targets.length == 0) {
        return false;
    }
    targets = targets.sort(cmpByStorePriority);
    var target = targets[0];
    var err = creep.transfer(target, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, target);
    }
    return true;
}

function Run(ctx, creep) {
    if(creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
        creep.memory.harvesting = false;
        creep.say('store');
    }
    if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.harvesting) {
        harvestEnergy(ctx, creep);
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