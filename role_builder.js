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

function try2Repair(ctx, creep) {
    var repairs = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            var res = structure.hits < structure.hitsMax && structure.structureType != 'constructedWall';
            if(structure.my != undefined) {
                res = res && structure.my;
            }
            return res;
        }
    });;
    if(repairs.length == 0) {
        return false;
    }
    repairs = repairs.sort(utils.CmpByObjDist2GivenPos(creep.pos));
    var err = creep.repair(repairs[0]);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, repairs[0]);
    }
    return true;
}

function try2Build(ctx, creep) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES, {
        filter: (site) => {
            return site.my;
        }
    });
    if(targets.length == 0) {
        return false;
    }
    targets = targets.sort(utils.CmpByObjDist2GivenPos(creep.pos));
    // TODO: resolve block
    var source = ctx.sources[0];
    var target = targets[0];
    // build road first.
    var roads = targets.filter((structure) => {
        return structure.structureType == 'road';
    });
    if(roads.length > 0) {
        target = roads[0];
    }
    var err = creep.build(target);
    if(err == ERR_NOT_IN_RANGE) {
        utils.DefaultMoveTo(creep, target);
    }
    return true;
}

function escapeFromSource(ctx, creep, src) {
    creep.memory.needMove = true;
    creep.moveByPath(PathFinder.search(creep.pos, {pos: src.pos, range: 1}, {flee: true}));
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

    // repaire logic
    if(try2Repair(ctx, creep)) {
        return;
    }
    // build logic
    if(try2Build(ctx, creep)) {
        return;
    }
    // no work to do
    // TODO: set a rest point
    utils.DefaultMoveTo(creep, ctx.spawn);
}

module.exports = {
    Run
};