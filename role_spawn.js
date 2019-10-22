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

var worker_parts = {
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

var miner_parts = {
    550: [WORK, WORK, WORK, WORK, WORK, MOVE],
    600: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE]
};

function Run(ctx, spawn) {
    var harvester_num = 2;
    var upgrader_num = 1;
    var builder_num = 4;
    var myConstructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES, {
        filter: (site) => {
            return site.my;
        }
    });
    // TODO:
    if(myConstructionSites.length == 0) {
        builder_num = 1;
    }
    upgrader_num = 5 - builder_num;
    
    var harvesters = getRoleNum('harvester');
    var upgraders = getRoleNum('upgrader');
    var builders = getRoleNum('builder');

    // TODO: extend
    var max_energy = Math.min(getMaxEnergyForSpawn(spawn), 800);
    var energy = Math.min(getCurEnergyForSpawn(spawn), 800);
    var parts = [WORK, CARRY, MOVE];
    // var parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    // if(energy >= 500) parts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    // var soilder_parts = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
    //                      ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
    
    //console.log('Harvesters: ' + harvesters.length);

    // at least one harverst alive
    if(harvesters.length > 0) {
        var stage = parseInt(max_energy / 50) * 50;
        parts = worker_parts[stage];
    } else {
        var stage = parseInt(energy / 50) * 50;
        if(stage >= 200) {
            createCreep(spawn, 'harvester', worker_parts[stage]);
        }
        return;
    }

    if(energy < stage) return;

    if(harvesters.length < harvester_num) {
        createCreep(spawn, 'harvester', parts);
    } else if(upgraders.length < upgrader_num) {
        createCreep(spawn, 'upgrader', parts);
    } else if(builders.length < builder_num) {
        createCreep(spawn, 'builder', parts);
    }
}

module.exports = {
    Run
};