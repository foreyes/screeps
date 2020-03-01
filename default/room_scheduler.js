var utils = require('utils');
var stages = require('stage_scheduler').stages;

var roleMap = {
    spawn: require('role_spawn'),
    upgrader: require('role_upgrader'),
    repairer: require('role_repairer'),
    builder: require('role_builder'),
    filler: require('role_filler'),
    miner: require('role_miner'),
    tower: require('role_tower'),
    specialer: require('role_specialer'),
    mineraler: require('role_mineraler'),
    labHelper: require('role_labHelper'),
    nukerHelper: require('role_nukerHelper'),
};

function Run(gCtx, room) {
    var ctx = room.ctx;

    try {
        var nxtNewStages = [];
        for(var stageFuncIdx in room.cache.newStages) {
            var stageFunc = room.cache.newStages[stageFuncIdx];
            if(!stageFunc(ctx)) {
                nxtNewStages.push(stageFunc);
            }
        }
        room.cache.newStages = nxtNewStages;
    } catch(err) {
        var errMsg = 'New stage in Room ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    if(ctx.my && ctx.room.controller.level >= 5 && ctx.room.memory.ctx.repairerNum > 0) {
        ctx.room.memory.ctx.repairerNum = 0;
    }

    try {
        // run room scheduler logic
        // step1: if a task is ready, pick it into ready.
        var newWait = [], ready = [];
        for(var i in room.memory.ctx.Wait) {
            var task = room.memory.ctx.Wait[i];
            if(task.wait == 0) {
                ready.push(task.name);
            } else {
                newWait.push(task);
            }
        }
        // step2: run init function for ready tasks, then push into Running.
        room.memory.ctx.Wait = newWait;
        for(var i in ready) {
            var name = ready[i];
            var task = stages[name];
            task.init(ctx, task.next);
            room.memory.ctx.Running.push(name);
        }
        // step3: run loop function for Running tasks, check if need terminate.
        var newRunning = [];
        for(var i in room.memory.ctx.Running) {
            var name = room.memory.ctx.Running[i];
            var task = stages[name];
            if(task.loop(ctx)) {
                task.terminate(ctx, task.next);
            } else {
                newRunning.push(name);
            }
        }
        room.memory.ctx.Running = newRunning;
    } catch(err) {
        var errMsg = 'Room Scheduler in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    // run tower logic.
    try {
        roleMap['tower'].Run(ctx);
    } catch(err) {
        var errMsg = 'Tower in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    // run role logic.
    var spawn = ctx.spawn, room = ctx.room;

    for(var name in ctx.creeps) {
        try {
            var creep = ctx.creeps[name];
            if(creep.spawning) continue;
            if(creep.memory.movePath) {
                var path = utils.ParsePathFromMemoryObject(creep.memory.movePath.path);
                switch(creep.memory.movePath.state) {
                case 'toStart': {
                    if(!creep.pos.isEqualTo(path[0])) {
                        utils.DefaultMoveTo(creep, path[0]);
                        break;
                    }
                }
                case 'move': {
                    creep.memory.movePath.state = 'move';
                    if(!creep.pos.isEqualTo(path[path.length-1])) {
                        creep.moveByPath(path);
                        break;
                    }
                }
                case 'end': {
                    delete creep.memory.movePath;
                    break;
                }
                }
                continue;
            }
            var start = Game.cpu.getUsed();

            // update stuck count
            if(creep.memory.needMove && utils.IsSamePosition(creep.memory.lastPos, creep.pos)) {
                creep.memory.stuck += 1;
            } else {
                creep.memory.stuck = 0;
            }
            creep.memory.needMove = false;
            creep.memory.lastPos = creep.pos;
            // run role logic

            // no role
            if(!creep.memory.role || creep.memory.role == 'manager') continue;
            // special roles
            if(creep.memory.role == 'mister') {
                require('mister').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.normalCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            if(creep.memory.role == 'simple_outer') {
                require('role_simple_outer').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.normalCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            if(creep.memory.role == 'outMiner') {
                require('role_outMiner').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.outCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            if(creep.memory.role == 'outReserver') {
                require('role_outReserver').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.outCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            if(creep.memory.role == 'outCarrier') {
                require('role_outCarrier').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.outCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            if(creep.memory.role == 'defender') {
                require('role_defender').Run(ctx, creep);
                var diff = Game.cpu.getUsed() - start;
                gCtx.outCreepCpu += diff;
                if(diff > 1) console.log(creep.name + ': ', diff);
                continue;
            }
            // normal role
            if(creep.room.name != room.name) {
                utils.DefaultMoveTo(creep, new RoomPosition(25, 25, room.name));
            } else {
                roleMap[creep.memory.role].Run(ctx, creep);
            }
            var diff = Game.cpu.getUsed() - start;
            gCtx.normalCreepCpu += diff;
            if(diff > 1) {
                console.log(creep.name + ': ', diff);
            }
        } catch(err) {
            console.log(creep.memory.role);
            var errMsg = 'Creep ' + ctx.creeps[name].name + ' in ' + room.name + ": ";
            utils.TraceError(err, errMsg);
        }
    }
    try {
        // run main spawn first, and at most spawn one creep pre tick.
        var err = -233;
        if(spawn != undefined) {
            err = roleMap['spawn'].Run(ctx, spawn);
        }
        if(err != 0) {
            for(var i in ctx.spawns) {
                if(!spawn || ctx.spawns[i].name != spawn.name) {
                    var err = roleMap['spawn'].Run(ctx, ctx.spawns[i], false);
                    if(err == 0) {
                        break;
                    }
                }
            }
        }
    } catch(err) {
        var errMsg = 'Spawn in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    if(ctx.powerSpawn) {
        // central schedule
        if(ctx.terminal && ctx.spawn && ctx.centralLink &&
             ctx.spawn.pos.isNearTo(ctx.powerSpawn) && ctx.centralLink.pos.isNearTo(ctx.powerSpawn) &&
             ctx.terminal.store[RESOURCE_POWER] + ctx.powerSpawn.store[RESOURCE_POWER] > 0) {
            var order = utils.Any(Game.market.orders, (o) => {
                return o.roomName == room.name && o.type == ORDER_BUY &&
                        o.resourceType == RESOURCE_ENERGY && o.remainingAmount > 0;
            });
            if(!order && ctx.terminal.store[RESOURCE_ENERGY] < 20000 && ctx.storage.store[RESOURCE_ENERGY] < 300000) {
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: RESOURCE_ENERGY,
                    price: 0.045,
                    totalAmount: 40000,
                    roomName: room.name,
                });
            }
            if((ctx.storage && ctx.storage[RESOURCE_ENERGY] >= 300000) ||
                ctx.terminal.store[RESOURCE_ENERGY] >= 20000) {
                if(Memory.processPower){
                    ctx.powerSpawn.processPower();
                }
            }
        } else {
            if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] >= 300000) {
                if(Memory.processPower) {
                    ctx.powerSpawn.processPower();
                }
            }
        }
    }
    // boost
    if(ctx.centralLabs && ctx.centralLabs.length >= 2 && ctx.reactionLabs) {
        for(var i in ctx.reactionLabs) {
            ctx.reactionLabs[i].runReaction(ctx.centralLabs[0], ctx.centralLabs[1]);
        }
    }
    if(ctx.labs && ctx.labs.length >= 6 && room.cache.needBoost) {
        for(var i = 0; i < 6; i++) {
            var lab = ctx.labs[i];
            var creeps4Boost = lab.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: (creep) => {
                    return creep.memory.needBoost && creep.memory.boostCnt > 0;
                }
            });
            for(var creep of creeps4Boost) {
                var err = lab.boostCreep(creep);
                if(err == 0) {
                    creep.memory.boostCnt -= 1;
                    break;
                }
            }
        }
    }
    if(ctx.sourceLinks && ctx.centralLink) {
        for(var i in ctx.sourceLinks) {
            var link = ctx.sourceLinks[i];
            if(link.store.getFreeCapacity(RESOURCE_ENERGY) < 100) {
                link.transferEnergy(ctx.centralLink);
            }
        }
    }
}

module.exports = {
    Run,
}; 