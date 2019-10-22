var utils = require('utils');

function getRoleNum(roleName) {
    return _.filter(Game.creeps, (creep) => creep.memory.role == roleName);
}

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

function createCreep(spawn, roleName, parts = [WORK, CARRY, MOVE]) {
    var newName = roleName + Game.time;
    spawn.spawnCreep(parts, newName, {memory: {role: roleName}});
}

var workerParts = {
    200: [WORK, CARRY, MOVE],
    250: [WORK, CARRY, MOVE, MOVE],
    300: [WORK, CARRY, CARRY, MOVE, MOVE],
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    450: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    500: [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    650: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    700: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    750: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
};

var minerParts = {
    550: [WORK, WORK, WORK, WORK, WORK, MOVE],
    600: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]
};

function Run(ctx, spawn) {
    var workerHarvesters = getRoleNum('workerHarvester');
    var workerUpgraders = getRoleNum('workerUpgrader');
    var workerBuilders = getRoleNum('workerBuilder');
    var workerRepairers = getRoleNum('workerRepairer');

    // TODO: extend
    var max_energy = Math.min(getMaxEnergyForSpawn(spawn), 800);
    var energy = Math.min(getCurEnergyForSpawn(spawn), 800);
    var parts = [];

    if(workerHarvesters.length > 0) {
        var stage = parseInt(max_energy / 50) * 50;
        parts = workerParts[stage];
    } else {
        var stage = parseInt(energy / 50) * 50;
        if(stage >= 200) {
            createCreep(spawn, 'workerHarvester', workerParts[stage]);
        }
        return;
    }

    if(energy < stage) return;

    if(workerHarvesters.length < Memory.ctx.workerHarvesterNum) {
        createCreep(spawn, 'workerHarvester', parts);
    } else if(workerUpgraders.length < Memory.ctx.workerUpgraderNum) {
        createCreep(spawn, 'workerUpgrader', parts);
    } else if(workerRepairers.length < Memory.ctx.workerRepairerNum) {
        createCreep(spawn, 'workerRepairer', parts);
    } else if(workerBuilders.length < Memory.ctx.workerBuilderNum) {
        createCreep(spawn, 'workerBuilder', parts);
    }
}

module.exports = {
    Run
};