var utils = require('utils');

var roleMap = {
    filler: require('role_filler'),
    upgrader: require('role_upgrader'),
    repairer: require('role_repairer'),
    builder: require('role_builder'),
    miner: require('role_miner'),
    simple_outer: require('role_simple_outer'),
    specialer: require('role_specialer'),
};

// opt: parts, must, givenName, memory
function spawnCreep(ctx, spawn, roleName, opt = {}) {
    // fetch parts
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
    if(opt.directions == undefined) {
        var err = spawn.spawnCreep(parts, name, {memory: creepMemory});
        return err == 0;
    } else {
        var err = spawn.spawnCreep(parts, name, {memory: creepMemory, directions: opt.directions});
        return err == 0;
    }
}

function runStart(ctx, spawn) {
    // level 1
    if(ctx.room.controller.level == 1) {
        if(ctx.upgraders.length < 2) {
            return spawnCreep(ctx, spawn, 'upgrader');
        }
        return true;
    }

    // level 2
    if(ctx.upgraders.length < 1) {
        return spawnCreep(ctx, spawn, 'upgrader');
    }
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
    return true;
}

function Run(ctx, spawn) {
    if(spawn.spawning) return true;

    ctx.MaxEnergy = utils.GetMaxEnergyForSpawn(spawn);
    ctx.CurEnergy = utils.GetCurEnergyForSpawn(spawn);

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
        if(creep && creep.memory.workPartsNum != undefined && creep.memory.workPartsNum < 5 && ctx.CurEnergy >= 550) {
            creep.suicide();
        }
        if(!creep) {
            return spawnCreep(ctx, spawn, 'miner', {must: true, givenName: name, memory: {sourceIdx: i}});
        }
    }
    // spawn filler
    if(ctx.fillers.length < ctx.room.memory.ctx.fillerNum) {
        return spawnCreep(ctx, spawn, 'filler')
    }
    // TODO: develop this part
    // spawn simple outer
    var outList = {
        E33N36: ['out1', 'out2', 'out3', 'out4'],
        E29N34: ['E29N35_1'],
    };
    for(var roomName in outList) {
        if(spawn.room.name != roomName) continue;
        outList[roomName].forEach((flag) => {
            if(ctx.room.memory.tmp == undefined) {
                ctx.room.memory.tmp = {};
            }
            var creep = Game.getObjectById(ctx.room.memory.tmp[flag]);
            if(!creep) {
                if(spawnCreep(ctx, spawn, 'simple_outer', {memory: {flagName: flag}})) {
                    return true;
                }
            }
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
    return false;
}

function SpawnCreep(spawnId, roleName, opt = {}) {
    var spawn = Game.getObjectById(spawnId);
    return spawnCreep(spawn.room.ctx, spawn, roleName, opt);
}

module.exports = {
    SpawnCreep,
    spawnCreep,
    Run
};