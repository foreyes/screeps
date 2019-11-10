var utils = require('utils');

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄 find energy');
    }
    if(ctx.flagDevRole) {
        utils.GetEnergyFromControllerStore(ctx, creep)
        return;
    }
    var source = ctx.sources[0];
    var err = creep.harvest(source);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, source);
    }
}

function Run(ctx, creep) {
    if(creep.memory.sleep) {
        creep.memory.sleep -= 1;
        return;
    }
    if(creep.memory.FindEnergy && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
        creep.memory.FindEnergy = false;
        creep.say('upgrade');
    }
    if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.FindEnergy) {
        findEnergy(ctx, creep);
        return;
    }

    var err = creep.upgradeController(ctx.room.controller);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, ctx.room.controller);
    }
    if(err == 0) {
        // just keep level when no need to upgrade
        if(ctx.room.controller.level >= 4 && ctx.room.memory.ctx.workerUpgraderNum == 1) {
            creep.memory.sleep = 10;
        }
        if(creep.memory.keepLevel) {
            creep.memory.sleep = 10;
        }
    }
}

module.exports = {
    Run
};