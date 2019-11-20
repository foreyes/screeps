var utils = require('utils');

var roleParts = {
    0: [],
    200: [WORK, CARRY, MOVE],
    300: [WORK, CARRY, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    1300: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1800: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    2300: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    3500: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};

function getCost(energy) {
    if(energy >= 3500) return 3500;
    if(energy >= 2300) return 2300;
    if(energy >= 1800) return 1800;
    if(energy >= 1300) return 1300;
    if(energy >= 800) return 800;
    if(energy >= 550) return 550;
    if(energy >= 400) return 400;
    if(energy >= 300) return 300;
    if(energy >= 200) return 200;
    return 0;
}

function GetPartsAndCost(energy, ctx = {}) {
    var cost = getCost(energy);
    if(ctx.keepLevel) {
        cost = Math.min(cost, 200);
    }
    var parts = roleParts[cost];
    return {cost: cost, parts: parts};
}

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄');
    }
    if(ctx.controllerContainer && ctx.controllerContainer.store[RESOURCE_ENERGY] > 0) {
        utils.GetEnergyFromControllerStore(ctx, creep)
        return;
    }
    if(Game.time % 10 == 0) {
        delete creep.memory.energyTargetId;
        delete creep.memory.targetId;
    }
    if(utils.GetEnergy4Worker(ctx, creep) || ctx.miners.length != 0) {
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
        creep.say('coming');
        utils.DefaultMoveTo(creep, ctx.room.controller);
    }
    if(err == 0) {
        // just keep level when no need to upgrade
        if(ctx.keepLevel) {
            creep.memory.sleep = 10;
        }
    }
}

module.exports = {
    GetPartsAndCost,
    Run
};