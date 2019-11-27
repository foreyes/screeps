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
};

// opt: parts, must, givenName, memory
function spawnCreep(ctx, spawn, roleName, opt = {}) {
    // fetch parts
    var cost = 0;
    var parts = opt.parts;
    if(parts == undefined) {
        var res = null;
        if(opt.must) {
            if(roleName == 'upgrader') {
                res = roleMap[roleName].GetPartsAndCost(ctx.CurEnergy, ctx);
            } else {
                res = roleMap[roleName].GetPartsAndCost(ctx.CurEnergy);
            }
        } else {
            if(roleName == 'upgrader') {
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
    var err = -233;
    if(opt.directions == undefined) {
        err = spawn.spawnCreep(parts, name, {memory: creepMemory, directions: [TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT]});
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

function Run(ctx, spawn, isMain = true) {
    if(spawn.spawning) return -233;

    ctx.MaxEnergy = ctx.room.energyAvailable;
    ctx.CurEnergy = ctx.room.energyCapacityAvailable;

    // in stage 1
    if(ctx.MaxEnergy < 350) {
        return runStart(ctx, spawn);
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
    if(ctx.mineralCanHarvest != undefined) {
        var name = 'mineraler' + ctx.mineralCanHarvest.id;
        var creep = Game.creeps[name];
        if(!creep) {
            return spawnCreep(ctx, spawn, 'mineraler', {givenName: name});
        }
    }
    // spawn factorier
    if(ctx.terminal && ctx.factoriers.length == 0 && isMain) {
        return spawnCreep(ctx, spawn, 'specialer', {
            directions: [TOP],
            parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
            memory: {specialType: 'factorier'}
        });
    }
    // spawn upgrader
    if(ctx.upgraders.length < ctx.room.memory.ctx.upgraderNum) {
        return spawnCreep(ctx, spawn, 'upgrader');
    }
    // spawn repairer
    if(ctx.repairers .length < ctx.room.memory.ctx.repairerNum) {
        return spawnCreep(ctx, spawn, 'repairer');
    }
    // spawn builder
    if(ctx.builders .length < ctx.room.memory.ctx.builderNum) {
        return spawnCreep(ctx, spawn, 'builder');
    }

    var roomConfig = require('room_config')[ctx.room.name];
    if(roomConfig != undefined) {
        for(var roomName in roomConfig.outSources) {
            var outSource = roomConfig.outSources[roomName];
            // defender
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
            if(Game.rooms[roomName] && (!Game.rooms[roomName].controller.reservation || Game.rooms[roomName].controller.reservation.ticksToEnd < 2000)) {
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

    return -233;
}

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