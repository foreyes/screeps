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
    var newWait = [], ready = [];
    for(var i in room.memory.ctx.Wait) {
        var x = room.memory.ctx.Wait[i];
        if(x.wait == 0) {
            ready.push(x.name);
        } else {
            newWait.push(x);
        }
    }
    room.memory.ctx.Wait = newWait;
    for(var i in ready) {
        var name = ready[i];
        var stage = stages[name];
        stage.init(ctx, stage.next);
        room.memory.ctx.Running.push(name);
    }
    var newRunning = [];
    for(var i in room.memory.ctx.Running) {
        var name = room.memory.ctx.Running[i];
        var stage = stages[name];
        if(stage.loop(ctx)) {
            stage.terminate(ctx, stage.next);
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

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.memory.needMove = false;
        if(creep.memory.role == undefined) continue;

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
    roleMap['spawn'].Run(ctx, spawn);
}

module.exports = {
	Run,
};