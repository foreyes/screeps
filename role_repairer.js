var utils = require('utils');

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄 find energy');
    }
    // TODO: get from container.
    // TODO: plan it
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
        filter: (site) => {
            var res = structure.hits != undefined;
            res = res && structure.hits < structure.hitsMax && structure.structureType != 'constructedWall';
            if(structure.my != undefined) {
                res = res && structure.my;
            }
            return res;
        }
    });
    if(targets.length == 0) {
        return null;
    }
    var target = creep.pos.findClosestByPath(targets, {ignoreCreeps: true});
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

    ctx.sources.forEach((src) => {
        if(utils.GetDirectDistance(creep.pos, src.pos) == 1) {
            escapeFromSource(ctx, creep, src);
            return;
        }
    });

    // repair logic
    if(try2Repair(ctx, creep)) {
        return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.spawn);
}

module.exports = {
    Run
};