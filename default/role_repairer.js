var utils = require('utils');

var roleParts = {
    0: [],
    200: [WORK, CARRY, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
};

function getCost(energy) {
    if(energy >= 600) return 600;
    if(energy >= 400) return 400;
    if(energy >= 200) return 200;
    return 0;
}

function GetPartsAndCost(energy) {
    var cost = getCost(energy);
    var parts = roleParts[cost];
    return {cost: cost, parts: parts};
}

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄');
    }
    if(getTarget(ctx, creep) == null) {
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

function escapeFromSource(ctx, creep, src) {
    creep.memory.needMove = true;
    creep.moveByPath(PathFinder.search(creep.pos, {pos: src.pos, range: 1}, {flee: true}));
}

function checkTarget4Repair(target) {
    // check avaliable
    if(!target) return false;
    // check structure
    if(target.structureType == undefined || target.progress != undefined) return false;
    // check my structure
    if(target.my != undefined && !target.my) return false;
    // check hits
    return target.hits != undefined && target.hits < target.hitsMax
}

function getTarget(ctx, creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            var cond1 = structure.structureType == STRUCTURE_CONTAINER;
            var cond2 = structure.structureType == STRUCTURE_ROAD && ctx.towers.length == 0 && ctx.room.controller && ctx.room.controller.my;
            return (cond1 || cond2) && structure.hits < structure.hitsMax;
        }
    });
    if(targets.length == 0) {
        return null;
    }
    var target = creep.pos.findClosestByRange(targets, {ignoreCreeps: true});
    creep.memory.targetId = target.id;
    return target;
}

function try2Repair(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!checkTarget4Repair(target)) {
        target = getTarget(ctx, creep);
    }
    // no avaliable target.
    if(!target) {
        return false;
    }
    var err = creep.repair(target);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, target);
    }
    return true;
}

function Run(ctx, creep) {
    if(creep.memory.FindEnergy && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
        creep.memory.FindEnergy = false;
        creep.say('🚧 repair');
    }
    if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.FindEnergy) {
        findEnergy(ctx, creep);
        return;
    }

    // repair logic
    if(try2Repair(ctx, creep)) {
        return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.restPos);
    if(creep.memory.usefulTime == undefined) {
        creep.memory.usefulTime = 1500;
    }
    creep.memory.usefulTime -= 1;
}

module.exports = {
    Try2Repair: try2Repair,
    GetPartsAndCost,
    Run
};