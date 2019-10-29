var utils = require('utils');

var workerParts = {
    300: [WORK, CARRY, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    500: [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1000: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
};

var carrierParts = {
    300: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    750: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    900: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1050: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
};

function getMaxEnergyForSpawn(spawn) {
    var res = spawn.store.getCapacity(RESOURCE_ENERGY);
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension'});
    for(var i in extensions) {
        res += extensions[i].store.getCapacity(RESOURCE_ENERGY);
    }
    return res;
}

function getCurEnergyForSpawn(spawn) {
    var res = spawn.store[RESOURCE_ENERGY];
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension'});
    for(var i in extensions) {
        res += extensions[i].store[RESOURCE_ENERGY];
    }
    return res;
}

function createCreep(spawn, roleName, parts, creepMemory = {}) {
    var newName = roleName + Game.time;
    creepMemory.role = roleName;
    spawn.spawnCreep(parts, newName, {memory: creepMemory});
}

var minerParts = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE];

function spawnMiner(ctx, sourceIdx) {
    if(ctx.CurEnergy >= 600) {
        createCreep(ctx.spawn, 'miner', minerParts, {'sourceIdx': sourceIdx});
    }
}

function getCarrierPartsLevel(energy) {
    if(energy >= 1200) return 1200;
    if(energy >= 1050) return 1050;
    if(energy >= 900) return 900;
    if(energy >= 750) return 750;
    if(energy >= 300) return 300;
    return 0;
}

function spawnCarrier(ctx, roleName) {
    var needEnergy = getCarrierPartsLevel(ctx.MaxEnergy);
    if(ctx.CurEnergy < needEnergy) return;
    createCreep(ctx.spawn, roleName, carrierParts[needEnergy]);
}

function getWorkerPartsLevel(energy) {
    if(energy >= 1200) return 1200;
    if(energy >= 1000) return 1000;
    if(energy >= 800) return 800;
    if(energy >= 600) return 600;
    if(energy >= 500) return 500;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    if(energy >= 300) return 300;
    return 0;
}

function spawnWorker(ctx, roleName) {
    var needEnergy = getWorkerPartsLevel(ctx.MaxEnergy);
    if(ctx.CurEnergy < needEnergy) return;
    createCreep(ctx.spawn, roleName, workerParts[needEnergy]);
}

function runAfterDevRoles(ctx, spawn) {
    // spawn spawner if there is no spawner
    if(ctx.spawners.length + ctx.carriers.length == 0) {
        if(ctx.CurEnergy >= 300) {
            var partsLevel = getCarrierPartsLevel(ctx.CurEnergy);
            createCreep(spawn, 'spawner', carrierParts[partsLevel]);
        }
        return;
    }
    // renew miner if neccesary
    for(var i in ctx.miners) {
        if(ctx.miners[i].ticksToLive < 1300) {
            var err = spawn.renewCreep(ctx.miners[i]);
            if(err != ERR_NOT_IN_RANGE) {
                return;
            }
        }
    }
    // spawn miner
    for(var i in ctx.sources) {
        if(ctx.room.memory.ctx.minerId4Source == undefined) {
            spawnMiner(ctx, i);
            return;
        }

        var miner = Game.getObjectById(ctx.room.memory.ctx.minerId4Source[i]);
        if(!miner) {
            spawnMiner(ctx, i);
            return;
        }
    }
    // spawn carrier
    if(ctx.carriers.length + ctx.spawners.length < ctx.room.memory.ctx.carrierNum) {
        spawnCarrier(ctx, 'carrier');
        return;
    }
    // spawn harvester for 
    if(ctx.workerHarvesters.length < ctx.room.memory.ctx.workerHarvesterNum) {
        spawnWorker(ctx, 'workerHarvester');
        return;
    }
    // spawn upgrader
    if(ctx.workerUpgraders .length < ctx.room.memory.ctx.workerUpgraderNum) {
        spawnWorker(ctx, 'workerUpgrader');
        return;
    }
    // spawn repairer
    if(ctx.workerRepairers .length < ctx.room.memory.ctx.workerRepairerNum) {
        spawnWorker(ctx, 'workerRepairer');
        return;
    }
    // spawn builder
    if(ctx.workerBuilders .length < ctx.room.memory.ctx.workerBuilderNum) {
        spawnWorker(ctx, 'workerBuilder');
        return;
    }
}

function Run(ctx, spawn) {
    ctx.MaxEnergy = getMaxEnergyForSpawn(spawn);
    ctx.CurEnergy = getCurEnergyForSpawn(spawn);

    if(ctx.flagDevRole) {
        runAfterDevRoles(ctx, spawn);
        return;
    }

    var workerHarvesters = utils.GetMyCreepsByRole(spawn.room, 'workerHarvester');
    var workerUpgraders = utils.GetMyCreepsByRole(spawn.room, 'workerUpgrader');
    var workerBuilders = utils.GetMyCreepsByRole(spawn.room, 'workerBuilder');
    var workerRepairers = utils.GetMyCreepsByRole(spawn.room, 'workerRepairer');
    var carriers = utils.GetMyCreepsByRole(spawn.room, 'carrier');
    var spawners = utils.GetMyCreepsByRole(spawn.room, 'spawner');
    var miners = utils.GetMyCreepsByRole(spawn.room, 'miner');

    var level = 300;
    if(workerHarvesters.length > 0) {
        level = getWorkerPartsLevel(ctx.MaxEnergy);
    } else {
        level = getWorkerPartsLevel(ctx.CurEnergy)
        if(level >= 300) {
            createCreep(spawn, 'workerHarvester', workerParts[level]);
        }
        return;
    }

    if(ctx.CurEnergy < level) return;
    var parts = workerParts[level];

    if(workerHarvesters.length < ctx.room.memory.ctx.workerHarvesterNum) {
        createCreep(spawn, 'workerHarvester', parts);
    } else if(workerUpgraders.length < ctx.room.memory.ctx.workerUpgraderNum) {
        createCreep(spawn, 'workerUpgrader', parts);
    } else if(workerRepairers.length < ctx.room.memory.ctx.workerRepairerNum) {
        createCreep(spawn, 'workerRepairer', parts);
    } else if(workerBuilders.length < ctx.room.memory.ctx.workerBuilderNum) {
        createCreep(spawn, 'workerBuilder', parts);
    }
}

module.exports = {
    Run
};