var utils = require('utils');

// 300, 550, 800, 1300, 1800, 2300
var harvesterParts = {
    250: [WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    500: [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
};
function getHarvestPartsNeed(energy) {
    if(energy >= 500) return 500;
    if(energy >= 400) return 400;
    return 250;
}
var upgraderParts = {
    250: [WORK, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1300: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1800: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2300: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};
function getUpgraderPartsNeed(energy) {
    if(energy >= 2300) return 2300;
    if(energy >= 1800) return 1800;
    if(energy >= 1300) return 1300;
    if(energy >= 800) return 800;
    if(energy >= 550) return 550;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    return 250;
}
var builderParts = {
    250: [WORK, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, MOVE, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1200: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1800: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2200: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};
function getBuilderPartsNeed(energy) {
    if(energy >= 2200) return 2200;
    if(energy >= 1800) return 1800;
    if(energy >= 1200) return 1200;
    if(energy >= 800) return 800;
    if(energy >= 600) return 600;
    if(energy >= 550) return 550;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    return 250;
}
var repairerParts = {
    250: [WORK, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, MOVE, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
};
function getRepairerPartsNeed(energy) {
    if(energy >= 600) return 600;
    if(energy >= 550) return 550;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    return 250;
}
var carrierParts = {
    300: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    450: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    750: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1800: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2250: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};
function getCarrierPartsNeed(energy) {
    if(energy >= 2250) return 2250;
    if(energy >= 1800) return 1800;
    if(energy >= 1200) return 1200;
    if(energy >= 750) return 750;
    if(energy >= 450) return 450;
    return 300;
}
var wallRepairerParts = builderParts;
function getWallRepairerPartsNeed(energy) {
    return getCarrierPartsNeed(energy);
}
var minerParts = {
    300: [WORK, WORK, MOVE, MOVE],
    350: [WORK, WORK, WORK, MOVE],
    450: [WORK, WORK, WORK, WORK, MOVE],
    550: [WORK, WORK, WORK, WORK, WORK, MOVE],
    600: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE],
    750: [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
};
function getMinerPartsNeed(energy) {
    if(energy >= 750) return 750;
    if(energy >= 600) return 600;
    if(energy >= 550) return 550;
    if(energy >= 450) return 450;
    if(energy >= 350) return 350;
    return 300;
}

// --------------------------------------------------------
// parts design end
// --------------------------------------------------------

function getMaxEnergyForSpawn(spawn) {
    var res = spawn.store.getCapacity(RESOURCE_ENERGY);
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension' && structure.isActive()});
    for(var i in extensions) {
        res += extensions[i].store.getCapacity(RESOURCE_ENERGY);
    }
    return res;
}

function getCurEnergyForSpawn(spawn) {
    var res = spawn.store[RESOURCE_ENERGY];
    var extensions = spawn.room.find(FIND_STRUCTURES, {filter: (structure) => structure.structureType == 'extension' && structure.isActive()});
    for(var i in extensions) {
        res += extensions[i].store[RESOURCE_ENERGY];
    }
    return res;
}

function createCreep(spawn, roleName, parts, creepMemory = {}) {
    var newName = roleName + Game.time;
    if(creepMemory.role == undefined) {
        creepMemory.role = roleName;
    }
    if(creepMemory.ctrlRoom == undefined) {
        creepMemory.ctrlRoom = spawn.room.name;
    }
    if(creepMemory.ownRoom == undefined) {
        creepMemory.ownRoom = spawn.room.name;
    }
    spawn.spawnCreep(parts, newName, {memory: creepMemory});
}

// TODO:
function spawnMiner(ctx, sourceIdx) {
    var need = getMinerPartsNeed(ctx.CurEnergy);
    createCreep(ctx.spawn, 'miner', minerParts[need], {'sourceIdx': sourceIdx});
}

function spawnCarrier(ctx, roleName) {
    var needEnergy = getCarrierPartsNeed(ctx.MaxEnergy);
    if(ctx.CurEnergy < needEnergy) return;
    createCreep(ctx.spawn, roleName, carrierParts[needEnergy]);
}

// woi
function spawnBuilder

function spawnWorker(ctx, roleName) {
    var needEnergy = getWorkerPartsLevel(ctx.MaxEnergy);
    if(ctx.CurEnergy < needEnergy) return;
    createCreep(ctx.spawn, roleName, workerParts[needEnergy]);
}

function SpawnWorker4Room(spawnName, roomName, roleName) {
    var spawn = Game.spawns[spawnName];
    var needEnergy = 1200;
    createCreep(spawn, roleName, workerParts[needEnergy], {ownRoom: roomName, ctrlRoom: roomName});
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
    SpawnWorker4Room,
    Run
};