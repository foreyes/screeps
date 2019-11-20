var utils = require('utils');
var stages = require('stage_scheduler').stages;

function fetchRoomCtx(gCtx, room) {
    if(room.memory.ctx == undefined) {
        require('context').InitRoomCtx(gCtx, room);
    }
    return require('context').FetchRoomCtx(gCtx, room);
}

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
};

function Run(gCtx, room) {
    var ctx = fetchRoomCtx(gCtx, room);
    room.ctx = ctx;

    try {
        if(ctx.storage) {
            if(ctx.room.memory.storageStat == undefined) {
                ctx.room.memory.storageStat = ctx.storage.store[RESOURCE_ENERGY];
            }
            if(ctx.room.memory.storageHis == undefined) {
                ctx.room.memory.storageHis = [];
            }
            if(Game.time % 1000 == 0) {
                ctx.room.memory.storageHis.push(ctx.storage.store[RESOURCE_ENERGY] - ctx.room.memory.storageStat);
                ctx.room.memory.storageStat = ctx.storage.store[RESOURCE_ENERGY];
            }
        }
    } catch(err) {
        var errMsg = 'Storage stats in Room ' + room.name + ": ";
        utils.TraceError(err, errMsg);
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
        for(var i in ctx.towers) {
            roleMap['tower'].Run(ctx, ctx.towers[i]);
        }
    } catch(err) {
        var errMsg = 'Tower in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }
    

    // run role logic.
    var spawn = ctx.spawn, room = ctx.room;

    for(var name in ctx.creeps) {
        try {
            var creep = ctx.creeps[name];
            if(creep.memory.role == undefined || creep.memory.role == null) continue;

            if(creep.memory.role == 'mister') {
                require('mister').Run(ctx, creep);
                if(creep.memory.lastPos == undefined) {
                    creep.memory.lastPos = creep.pos;
                    creep.memory.stuck = 0;
                }
                if(!creep.memory.needMove || creep.pos.x != creep.memory.lastPos.x || creep.pos.y != creep.memory.lastPos.y) {
                    creep.memory.stuck = 0;
                } else {
                    if(creep.fatigue == 0){
                        creep.memory.stuck += 1;
                    }
                }
                creep.memory.lastPos = creep.pos;
                creep.memory.needMove = false;
                continue;
            }
            if(creep.memory.role == 'simple_outer') {
                require('role_simple_outer').Run(ctx, creep);
                if(creep.memory.lastPos == undefined) {
                    creep.memory.lastPos = creep.pos;
                    creep.memory.stuck = 0;
                }
                if(!creep.memory.needMove || creep.pos.x != creep.memory.lastPos.x || creep.pos.y != creep.memory.lastPos.y) {
                    creep.memory.stuck = 0;
                } else {
                    if(creep.fatigue == 0){
                        creep.memory.stuck += 1;
                    }
                }
                creep.memory.lastPos = creep.pos;
                creep.memory.needMove = false;
                continue;
            }
            if(creep.room.name != room.name) {
                utils.DefaultMoveTo(creep, new RoomPosition(25, 25, room.name));
                continue;
            }
            roleMap[creep.memory.role].Run(ctx, creep);
            if(creep.memory.lastPos == undefined) {
                creep.memory.lastPos = creep.pos;
                creep.memory.stuck = 0;
            }
            if(!creep.memory.needMove || creep.pos.x != creep.memory.lastPos.x || creep.pos.y != creep.memory.lastPos.y) {
                creep.memory.stuck = 0;
            } else {
                if(creep.fatigue == 0){
                    creep.memory.stuck += 1;
                }
            }
            creep.memory.lastPos = creep.pos;
            creep.memory.needMove = false;
        } catch(err) {
            console.log(creep.memory.role);
            var errMsg = 'Creep ' + name + ' in ' + room.name + ": ";
            utils.TraceError(err, errMsg);
        }
    }
    try {
        if(spawn != undefined && spawn.my) {
            roleMap['spawn'].Run(ctx, spawn);
        }
    } catch(err) {
        var errMsg = 'Spawn in ' + room.name + ": ";
        utils.TraceError(err, errMsg);
    }

    if(ctx.factory) {
        // ctx.factory.produce(RESOURCE_LEMERGIUM_BAR);
        // ctx.factory.produce(RESOURCE_ZYNTHIUM_BAR);
        // ctx.factory.produce(RESOURCE_KEANIUM_BAR);
        ctx.factory.produce(RESOURCE_CONDENSATE);
        ctx.factory.produce(RESOURCE_OXIDANT);
    }
    if(ctx.labs) {
        if(ctx.labers.length == 0) {
            require('role_spawn').SpawnCreep('5dc6d24401ce096f94fc8ea6', 'specialer', {parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], memory: {specialType: 'laber'}});
        }
        ctx.labs[2].runReaction(ctx.labs[0], ctx.labs[1]);
        ctx.labs[3].runReaction(ctx.labs[0], ctx.labs[1]);
    }
    if(ctx.sourceLinks && ctx.centralLink) {
        for(var i in ctx.sourceLinks) {
            var link = ctx.sourceLinks[i];
            if(link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                link.transferEnergy(ctx.centralLink);
            }
        }
    }
}

module.exports = {
    Run,
};