var utils = require('utils');

var workerParts = {
    300: [WORK, CARRY, CARRY, MOVE, MOVE],
    // TODO:
    350: [WORK, WORK, CARRY, MOVE, MOVE],
    400: [WORK, WORK, CARRY, CARRY, MOVE],
    450: [WORK, WORK, WORK, CARRY, MOVE, MOVE],
    500: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    550: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    600: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    800: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    1000: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
};

var carrierParts = {
    300: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    450: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    550: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    750: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    900: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1050: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2500: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};

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

function createCreep(spawn, roleName, parts, creepMemory = {}, name = 'null') {
    var newName = roleName + Game.time;
    if(name != 'null') {
        newName = name;
    }
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

var minerParts = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE];

function spawnMiner(ctx, name, sourceIdx) {
    if(ctx.CurEnergy >= 750) {
        createCreep(ctx.spawn, 'miner', [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE], {'sourceIdx': sourceIdx, workPartsNum: 6}, name);
    } else if(ctx.CurEnergy >= 600) {
        createCreep(ctx.spawn, 'miner', minerParts, {'sourceIdx': sourceIdx, workPartsNum: 5}, name);
    } else if(ctx.CurEnergy >= 550) {
        createCreep(ctx.spawn, 'miner', [WORK, WORK, WORK, WORK, WORK, MOVE], {'sourceIdx': sourceIdx, workPartsNum: 5}, name);
    } else if(ctx.CurEnergy >= 450) {
        createCreep(ctx.spawn, 'miner', [WORK, WORK, WORK, WORK, MOVE], {'sourceIdx': sourceIdx, workPartsNum: 4}, name);
    } else if(ctx.CurEnergy >= 350) {
        createCreep(ctx.spawn, 'miner', [WORK, WORK, WORK, MOVE], {'sourceIdx': sourceIdx, workPartsNum: 3}, name);
    } else {
        createCreep(ctx.spawn, 'miner', [WORK, WORK, MOVE], {'sourceIdx': sourceIdx, workPartsNum: 2}, name);
    }
}

function getCarrierPartsLevel(energy) {
    if(energy >= 2500) return 2500;
    if(energy >= 1200) return 1200;
    if(energy >= 1050) return 1050;
    if(energy >= 900) return 900;
    if(energy >= 750) return 750;
    if(energy >= 550) return 550;
    if(energy >= 450) return 450;
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
    if(energy >= 550) return 550;
    if(energy >= 500) return 500;
    if(energy >= 450) return 450;
    if(energy >= 400) return 400;
    if(energy >= 350) return 350;
    if(energy >= 300) return 300;
    return 0;
}

function spawnWorker(ctx, roleName) {
    var needEnergy = getWorkerPartsLevel(ctx.MaxEnergy);
    if(roleName == 'workerRepairer') {
        needEnergy = Math.min(needEnergy, 400);
    }
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
    // spawn miner
    for(var i in ctx.sources) {
        var name = 'miner' + ctx.sources[i].id;
        var creep = Game.creeps[name];
        if(!creep) {
            spawnMiner(ctx, name, i);
            return;
        } else {
            if(creep.memory.workPartsNum != undefined && creep.memory.workPartsNum < 5 && ctx.CurEnergy >= 550) {
                creep.suicide();
                spawnMiner(ctx, name, i);
                return;
            }
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
    // spawn simple outer
    if(spawn.room.name == 'E33N36'){
        ['out1', 'out2', 'out3', 'out4'].forEach((flag) => {
            if(ctx.room.memory.tmp == undefined) {
                ctx.room.memory.tmp = {};
            }
            var creep = Game.getObjectById(ctx.room.memory.tmp[flag]);
            if(!creep) {
                if(ctx.CurEnergy > 3000) {
                    createCreep(spawn, 'simple_outer', [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], {flagName: flag});
                    if(ctx.room.memory.tmp.cnt == undefined) {
                        ctx.room.memory.tmp.cnt = 0;
                    }
                    ctx.room.memory.tmp.cnt -= 3000;
                }
                return;
            }
        });
    }
    // spawn upgrader
    if(ctx.workerUpgraders.length < ctx.room.memory.ctx.workerUpgraderNum) {
    	if(ctx.room.memory.ctx.workerUpgraderNum == 1) {
    		spawnWorker(ctx, 'workerUpgrader');
            return;
    	}
        if(ctx.CurEnergy >= 3500) {
            createCreep(spawn, 'workerUpgrader', [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]);
            return;
        } else if(ctx.CurEnergy >= 2300) {
            createCreep(spawn, 'workerUpgrader', [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]);
            return;
        } else if(ctx.CurEnergy >= 800) {
            createCreep(spawn, 'workerUpgrader', [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE]);
            return;
        } else {
            spawnWorker(ctx, 'workerUpgrader');
            return;
        }
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
    if(spawn.spawning) return;

    ctx.MaxEnergy = getMaxEnergyForSpawn(spawn);
    ctx.CurEnergy = getCurEnergyForSpawn(spawn);

    if(ctx.MaxEnergy >= 350) {
        runAfterDevRoles(ctx, spawn);
        return;
    }
    if(ctx.room.memory.ctx.flagStarter != undefined && !ctx.room.memory.ctx.flagStarter) {
        var err = ctx.spawn.spawnCreep([WORK, WORK, CARRY, MOVE], ctx.room.name + 'starter', {memory: {role: 'specialer', specialType: 'starter'}});
        if(err != 0) {
            ctx.room.memory.ctx.flagStarter = true;
        }
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
    if(ctx.room.memory.ctx.workerHarvesterNum > 0) {
        if(workerHarvesters.length > 0) {
            level = getWorkerPartsLevel(ctx.MaxEnergy);
        } else {
            level = getWorkerPartsLevel(ctx.CurEnergy)
            if(level >= 300) {
                createCreep(spawn, 'workerHarvester', workerParts[level]);
            }
            return;
        }
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