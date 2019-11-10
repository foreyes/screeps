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
    workerHarvester: require('role_harvester'),
    workerUpgrader: require('role_upgrader'),
    workerRepairer: require('role_repairer'),
    workerBuilder: require('role_builder'),
    spawner: require('role_spawner'),
    carrier: require('role_carrier'),
    miner: require('role_miner'),
    tower: require('role_tower'),
};

function Run(gCtx, room) {
	var ctx = fetchRoomCtx(gCtx, room);

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

    // run tower logic.
    for(var i in ctx.towers) {
        roleMap['tower'].Run(ctx, ctx.towers[i]);
    }

    // run role logic.
    var spawn = ctx.spawn, room = ctx.room;

    for(var name in ctx.creeps) {
        var creep = ctx.creeps[name];
        creep.memory.needMove = false;
        if(creep.memory.role == undefined) continue;

        if(creep.memory.role == 'mister') {
            require('role_mister').Run(ctx, creep);
            continue;
        }
        if(creep.memory.role == 'simple_outer') {
            require('role_simple_outer').Run(ctx, creep);
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
    }
    if(spawn != undefined && spawn.my) {
        roleMap['spawn'].Run(ctx, spawn);
    }
}

module.exports = {
	Run,
};