var utils = require('utils');

function findEnergy(ctx, creep) {
    if(!creep.memory.FindEnergy) {
        creep.memory.FindEnergy = true;
        creep.say('🔄 find energy');
    }
    if(getTarget(ctx, creep) == null) {
        return;
    }
    if(ctx.flagDevRole) {
        utils.GetEnergyFromStore(ctx, creep)
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

    ctx.sources.forEach((src) => {
        if(utils.GetDirectDistance(creep.pos, src.pos) == 1) {
            escapeFromSource(ctx, creep, src);
            return;
        }
    });

    // build logic
    if(try2Build(ctx, creep)) {
        return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.restPos);
}

module.exports = {
    Run
};