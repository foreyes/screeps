var utils = require('utils');

var roleParts = {
    0: [],
    300: [WORK, CARRY, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE],
    450: [WORK, WORK, WORK, CARRY, MOVE, MOVE],
    500: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1000: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2200: utils.GetPartsByArray([[WORK, 11], [CARRY, 11], [MOVE, 11]]),
    3300: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};

function getCost(energy) {
    if(energy >= 3300) return 3300;
    if(energy >= 2200) return 2200;
    if(energy >= 1200) return 1200;
    if(energy >= 1000) return 1000;
    if(energy >= 800) return 800;
    if(energy >= 600) return 600;
    if(energy >= 550) return 550;
    if(energy >= 500) return 500;
    if(energy >= 450) return 450;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    if(energy >= 300) return 300;
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
    // TODO:
    // if(getTarget(ctx, creep) == null) {
    //     return;
    // }
    if(Game.time % 10 == 0) {
        delete creep.memory.energyTargetId;
        delete creep.memory.targetId;
    }
    if(utils.GetEnergy4Worker(ctx, creep)) return;

    var source = ctx.sources[0];
    if(ctx.sources.length >= 2 && (Game.creeps['miner' + source.id] || source.energy == 0)) {
        source = ctx.sources[1];
        if(Game.creeps['miner' + source.id] || source.energy == 0) return;
    }
    var err = creep.harvest(source);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, source);
    }
}

function escapeFromSource(ctx, creep, src) {
    creep.memory.needMove = true;
    creep.moveByPath(PathFinder.search(creep.pos, {pos: src.pos, range: 1}, {flee: true}));
}

function checkTarget4Build(target) {
    // check avaliable
    if(!target) return false;
    // check construction site
    if(target.structureType == undefined || target.progress == undefined) return false;
    // check my construction site
    return target.my == true;
}

function getBuildPriority(structure) {
    var st = structure.structureType;
    if(st == STRUCTURE_SPAWN) return -2;
    if(st == STRUCTURE_TOWER) return -1;
    if(st == STRUCTURE_EXTENSION) return 0;
    if(st == STRUCTURE_ROAD) return 1;
    if(st == STRUCTURE_CONTAINER) return 2;
    return 3;
}

function getTarget(ctx, creep) {
    var smallestPrio = 3;
    var targets = ctx.room.find(FIND_CONSTRUCTION_SITES, {
        filter: (site) => {
            if(site.my) {
                smallestPrio = Math.min(smallestPrio, getBuildPriority(site));
                return true;
            }
            return false;
        }
    });
    if(targets.length == 0) {
        return null;
    }
    targets = targets.filter((s) => getBuildPriority(s) == smallestPrio);
    var target = creep.pos.findClosestByPath(targets);
    if(!target) return null;
    creep.memory.targetId = target.id;
    return target;
}

function try2Build(ctx, creep) {
    var target = Game.getObjectById(creep.memory.targetId);
    if(!checkTarget4Build(target)) {
        target = getTarget(ctx, creep);
    }
    // no avaliable target.
    if(!target) {
        return false;
    }
    var err = creep.build(target);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, target);
    }
    // TODO: err 7
    return true;
}

function Run(ctx, creep) {
    if(creep.memory.FindEnergy && creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
        creep.memory.FindEnergy = false;
        creep.say('🚧 build');
    }
    if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.FindEnergy) {
        findEnergy(ctx, creep);
        return;
    }

    // build logic
    if(try2Build(ctx, creep)) {
        return;
    }
    // repair walls and ramparts
    var limit = ctx.wallHits;
    if(limit == undefined) limit = 10000;
    var targets = ctx.wallsAndRamparts.filter((s) => {
        return s.hits < limit;
    });
    if(targets.length != 0) {
        var target = creep.pos.findClosestByPath(targets);
        var err = creep.repair(target);
        if(err == ERR_NOT_IN_RANGE) {
            return utils.DefaultMoveTo(creep, target);
        }
        if(err == 0) return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.restPos);
}

module.exports = {
    Try2Build: try2Build,
    GetPartsAndCost,
    Run
};