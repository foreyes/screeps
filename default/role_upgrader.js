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
    3700: utils.GetPartsByArray([[WORK, 30], [CARRY, 6], [MOVE, 8]]),
};

function getCost(energy) {
    if(energy >= 3700) return 3700;
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
    if(ctx.upgrading && ctx.controllerContainer) {
        var err = creep.withdraw(ctx.controllerContainer, RESOURCE_ENERGY);
        if(err == ERR_NOT_IN_RANGE) {
            utils.DefaultMoveTo(creep, ctx.controllerContainer);
        }
        return;
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
    if(ctx.upgrading && creep.store[RESOURCE_ENERGY] > 0) {
        if(ctx.controllerContainer &&
            creep.pos.isEqualTo(ctx.controllerContainer.pos) &&
            ctx.controllerContainer.hits < ctx.controllerContainer.hitsMax) {
            return creep.repair(ctx.controllerContainer);
        }
        var err = creep.upgradeController(ctx.room.controller);
        if(err == ERR_NOT_IN_RANGE) {
            creep.say('coming');
            return utils.DefaultMoveTo(creep, ctx.room.controller);
        }
        if(!ctx.creepOnContainer) {
            return utils.DefaultMoveTo(creep, ctx.controllerContainer);
        }
        if(creep.pos.isEqualTo(ctx.controllerContainer)) {
            if(ctx.upgraders.length > 1) {
                var flag = false;
                for(var friend of ctx.upgraders) {
                    if(friend.id == creep.id) continue;
                    if(friend.pos.isNearTo(creep)) {
                        utils.DefaultMoveTo(friend, creep);
                        friend.cache.special = true;
                        flag = true;
                        break;
                    }
                }
                if(flag) {
                    return utils.DefaultMoveTo(creep, ctx.room.controller);
                }
            }
        }
        if(!creep.cache.special) {
            creep.cache.special = false;
            var structures = creep.pos.lookFor(LOOK_STRUCTURES);
            if(structures.filter((s) => s.structureType == STRUCTURE_ROAD).length > 0) {
                return utils.DefaultMoveTo(creep, ctx.room.controller);
            }
        }
        return;
    }
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

    if(creep.store[RESOURCE_ENERGY] > 0 && ctx.controllerContainer &&
        creep.pos.isEqualTo(ctx.controllerContainer.pos) &&
        ctx.controllerContainer.hits < ctx.controllerContainer.hitsMax) {
        return creep.repair(ctx.controllerContainer);
    }

    var err = creep.upgradeController(ctx.room.controller);
    if(err == ERR_NOT_IN_RANGE) {
        creep.say('coming');
        utils.DefaultMoveTo(creep, ctx.room.controller);
    }
    if(ctx.controllerContainer && !ctx.creepOnContainer) {
        utils.DefaultMoveTo(creep, ctx.controllerContainer);
    }
    if(err == 0) {
        // just keep level when no need to upgrade
        if(ctx.keepLevel && creep.getActiveBodyparts(WORK) == 1) {
            creep.memory.sleep = 10;
        }
    }
}

module.exports = {
    GetPartsAndCost,
    Run
};