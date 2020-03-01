var utils = require('utils');

var roleMap = {
    filler: require('role_filler'),
    upgrader: require('role_upgrader'),
    repairer: require('role_repairer'),
    builder: require('role_builder'),
    miner: require('role_miner'),
    simple_outer: require('role_simple_outer'),
    specialer: require('role_specialer'),
    mineraler: require('role_mineraler'),
    outMiner: require('role_outMiner'),
    outReserver: require('role_outReserver'),
    outCarrier: require('role_outCarrier'),
    defender: require('role_defender'),
    mister: require('mister'),
    manager: require('role_manager'),
    labHelper: require('role_labHelper'),
    nukerHelper: require('role_nukerHelper'),
};

// opt: parts, must, givenName, memory
function spawnCreep(ctx, spawn, roleName, opt = {}) {
    // fetch parts
    var cost = 0;
    var parts = opt.parts;
    if(parts == undefined) {
        var res = null;
        if(opt.must) {
            if(roleName == 'upgrader' || roleName == 'filler' || roleName == 'mister') {
                res = roleMap[roleName].GetPartsAndCost(ctx.CurEnergy, ctx);
            } else {
                res = roleMap[roleName].GetPartsAndCost(ctx.CurEnergy);
            }
        } else {
            if(roleName == 'upgrader' || roleName == 'filler' || roleName == 'mister') {
                res = roleMap[roleName].GetPartsAndCost(ctx.MaxEnergy, ctx);
            } else {
                res = roleMap[roleName].GetPartsAndCost(ctx.MaxEnergy);
            }
        }
        if(res.cost == 0 || res.cost > ctx.CurEnergy) return false;
        cost = res.cost;
        parts = res.parts;
    }
    // setup name
    var name = opt.givenName;
    if(name == undefined) {
        name = roleName + Game.time;
    }
    // setup creep memory
    var creepMemory = opt.memory;
    if(creepMemory == undefined) {
        creepMemory = {};
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
    creepMemory.spawnTime = parts.length * 3;
    var err = -233;
    if(opt.directions == undefined) {
        err = spawn.spawnCreep(parts, name, {memory: creepMemory, directions: [RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT]});
    } else {
        err = spawn.spawnCreep(parts, name, {memory: creepMemory, directions: opt.directions});
    }
    if(err == 0 && (creepMemory.role == 'outMiner' || creepMemory.role == 'outCarrier' || creepMemory.role == 'outReserver' || creepMemory.role == 'defender')) {
        if(Memory.statOutMiner == undefined) {
            Memory.statOutMiner = 0;
        }
        Memory.statOutMiner -= cost;
    }
    return err;
}

function runStart(ctx, spawn) {
    // level 1
    if(ctx.upgraders.length < 1) {
        return spawnCreep(ctx, spawn, 'upgrader');
    }
    if(ctx.room.controller.level == 1) return -233;

    // level 2
    var starters = ctx.room.find(FIND_CREEPS, {
        filler: (creep) => {
            return creep.my && creep.memory.role == 'specialer' && creep.memory.specialType == 'starter';
        }
    });
    if(starters.length < 2) {
        return spawnCreep(ctx, spawn, 'specialer', {
            parts: [WORK, WORK, CARRY, MOVE],
            memory: {
                specialType: 'starter'
            }
        });
    }
    return -233;
}

function hasLongLife(creep) {
    if(creep.spawning) return true;
    if(creep.memory.spawnTime == undefined) return true;
    return creep.ticksToLive > creep.memory.spawnTime;
}

function Run(ctx, spawn, isMain = true) {
    if(spawn.spawning) return -233;

    ctx.MaxEnergy = ctx.room.energyCapacityAvailable;
    ctx.CurEnergy = ctx.room.energyAvailable;

    // in stage 1
    if(ctx.MaxEnergy < 350) {
        return runStart(ctx, spawn);
    }

    if(ctx.room.cache.needBoost && !ctx.room.cache.boostPrepare) {
        var creepName = 'boostHelper' + ctx.room.name;
        if(!Game.creeps[creepName]) {
            return spawnCreep(ctx, spawn, 'specialer', {givenName: creepName, parts: utils.GetPartsByArray([[CARRY, 20], [MOVE, 10]]), memory: {specialType: 'boostHelper'}});
        }
    }

    if(ctx.extraSpawnFunction != undefined) {
        if(ctx.extraSpawnFunction(spawn)) {
            return;
        } else {
            delete ctx.extraSpawnFunction;
        }
    }

    // TODO: check if need emergency miner
    var needEmergencyMiner = false;
    // spawn the first filler
    if(ctx.fillers.length == 0 && !needEmergencyMiner) {
        return spawnCreep(ctx, spawn, 'filler', {must: true});
    }
    // spawn miner or update miner
    for(var i in ctx.sources) {
        var name = 'miner' + ctx.sources[i].id;
        var creep = Game.creeps[name];
        // update miner
        var flag = true;
        if(creep && creep.memory.workPartsNum != undefined && creep.memory.workPartsNum < 5 && ctx.CurEnergy >= 550) {
            creep.suicide();
            flag = false;
        }
        if(!creep || !flag) {
            return spawnCreep(ctx, spawn, 'miner', {must: true, givenName: name, memory: {sourceIdx: i}});
        }
    }
    // spawn filler
    if(ctx.fillers.length < ctx.room.memory.ctx.fillerNum) {
        return spawnCreep(ctx, spawn, 'filler')
    }
    // spawn mineraler
    if(ctx.mineralCanHarvest != undefined && ctx.terminal) {
        var name = 'mineraler' + ctx.mineralCanHarvest.id;
        var creep = Game.creeps[name];
        if(!creep) {
            return spawnCreep(ctx, spawn, 'mineraler', {givenName: name});
        }
    }
    // spawn manager
    if((ctx.centralLink || ctx.terminal) && ctx.managers.filter(hasLongLife).length == 0 && isMain) {
        return spawnCreep(ctx, spawn, 'manager', {
            directions: [TOP],
        });
    }
    // spawn upgrader
    if(ctx.upgraders.filter(hasLongLife).length < ctx.room.memory.ctx.upgraderNum) {
        return spawnCreep(ctx, spawn, 'upgrader');
    }
    // spawn repairer
    if(ctx.repairers.filter(hasLongLife).length < ctx.room.memory.ctx.repairerNum) {
        return spawnCreep(ctx, spawn, 'repairer');
    }
    // spawn builder
    if(ctx.builders.filter(hasLongLife).length < ctx.room.memory.ctx.builderNum) {
        return spawnCreep(ctx, spawn, 'builder');
    }

    var roomConfig = require('room_config')[ctx.room.name];
    if(roomConfig != undefined && ctx.storage) {
        for(var roomName in roomConfig.outSources) {
            var outSource = roomConfig.outSources[roomName];
            // defender
            if(!outSource.needDefender && Game.time % 97 == 17) {
                outSource.needDefender = Game.rooms[roomName] && Game.rooms[roomName].find(FIND_HOSTILE_STRUCTURES).length > 0;
            }
            if(outSource.needDefender) {
                var creepName = 'defender' + roomName;
                if(!Game.creeps[creepName]) {
                    return spawnCreep(ctx, spawn, 'defender', {givenName: creepName, memory: {
                        workRoom: roomName,
                    }});
                } else {
                    outSource.needDefender = false;
                }
            }
            // outReserver
            if(Game.rooms[roomName] && (!Game.rooms[roomName].controller.reservation || Game.rooms[roomName].controller.reservation.username != 'foreyes1001' || Game.rooms[roomName].controller.reservation.ticksToEnd < 2000)) {
                var creepName = 'outReserver' + outSource.controller;
                if(!Game.creeps[creepName]) {
                    return spawnCreep(ctx, spawn, 'outReserver', {givenName: creepName, memory: {
                        workRoom: roomName,
                    }});
                }
            }
            for(var i in outSource.sources) {
                // outMiner
                var creepName = 'outMiner' + outSource.sources[i];
                if(!Game.creeps[creepName]) {
                    return spawnCreep(ctx, spawn, 'outMiner', {givenName: creepName, memory: {
                        sourceIdx: i,
                        workRoom: roomName,
                    }});
                }
                // outCarrier
                creepName = 'outCarrier' + outSource.sources[i];
                if(!Game.creeps[creepName]) {
                    return spawnCreep(ctx, spawn, 'outCarrier', {givenName: creepName, memory: {
                        sourceIdx: i,
                        workRoom: roomName,
                    }});
                }
            }
        }
    }

    if(ctx.powerSpawn && !ctx.powerSpawn.pos.isNearTo(ctx.spawn) && ctx.terminal && ctx.terminal.store[RESOURCE_POWER] >= 100 &&
        ctx.storage && ctx.storage.store[RESOURCE_ENERGY] > 300000 && ctx.powerSpawners.length == 0) {
        return spawnCreep(ctx, spawn, 'specialer', {parts: utils.GetPartsByArray([[CARRY, 30], [MOVE, 15]]), memory: {
            specialType: 'powerSpawner',
        }});
    }

    if(ctx.room.memory.labState == 'reaction') {
        var creepName = ctx.room.name + '_labHelper';
        if(!Game.creeps[creepName]) {
            return spawnCreep(ctx, spawn, 'labHelper', {givenName: creepName});
        }
    }
}

// require('role_spawn').SpawnCreep('5e232fd905c1a5e4f09d0631', '', {memory: {flag: true}, givenName: '开拓者', parts: [CLAIM, MOVE]});
// require('role_spawn').SpawnCreep('5dc6e9c47f70d61ce9453a80', 'builder', {memory: {ctrlRoom: 'E29N33', ownRoom: 'E29N33'}});
// require('role_spawn').SpawnCreep('5dc6e9c47f70d61ce9453a80', 'miner', {givenName: 'miner5bbcaea19099fc012e63958c',parts: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE],memory: {ctrlRoom: 'E29N33', ownRoom: 'E29N33', sourceIdx: 0}});
// require('role_spawn').SpawnCreep('5dc6e9c47f70d61ce9453a80', 'miner', {givenName: 'miner5bbcaea19099fc012e63958d',parts: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE],memory: {ctrlRoom: 'E29N33', ownRoom: 'E29N33', sourceIdx: 1}});
function SpawnCreep(spawnId, roleName, opt = {}) {
    var spawn = Game.getObjectById(spawnId);
    return spawnCreep(spawn.room.ctx, spawn, roleName, opt);
}

module.exports = {
    SpawnCreep,
    spawnCreep,
    Run
};