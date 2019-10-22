var utils = require('utils');
var stages = require('stage_scheduler').stages;

function fetchCtx() {
    if(Memory.ctx == undefined) {
        require('context').InitWhenRespawn();
    }
    return require('context').FetchCtx();
}

var roleMap = {
    spawn: require('role_spawn'),
    harvester: require('role_harvester'),
    upgrader: require('role_upgrader'),
    repairer: require('role_repairer'),
    builder: require('role_builder')
};

// make sure spawn's adjusted 4 cells are not wall when respawn.
// spawn should not near by sources.
// sort from small to big
module.exports.loop = function () {
    var ctx = fetchCtx();

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    var spawn = ctx.spawn, room = ctx.room;

    var newWait = [], ready = [];
    for(var i in Memory.ctx.Wait) {
        var x = Memory.ctx.Wait[i];
        if(x.wait == 0) {
            ready = ready.concat(x.name);
        } else {
            newWait = newWait.concat(x);
        }
    }
    Memory.ctx.Wait = newWait;
    for(var i in ready) {
        var name = ready[i];
        var stage = stages[name];
        stage.init(ctx, stage.next);
        Memory.ctx.InProgress = Memory.ctx.InProgress.concat(name);
    }
    var newInProgress = [];
    for(var i in Memory.ctx.InProgress) {
        var name = Memory.ctx.InProgress[i];
        var stage = stages[name];
        if(stage.loop(ctx)) {
            stage.terminate(ctx, stage.next);
        } else {
            newInProgress = newInProgress.concat(name);
        }
    }
    Memory.ctx.InProgress = newInProgress;


    // run role logic.
    roleMap['spawn'].Run(ctx, spawn)
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.memory.needMove = false;
        roleMap[creep.memory.role].Run(ctx, creep);
        if(creep.memory.lastPos == undefined) {
            creep.memory.lastPos = creep.pos;
            creep.memory.stuck = 0;
        }
        if(!creep.memory.needMove || creep.pos.x != creep.memory.lastPos.x || creep.pos.y != creep.memory.lastPos.y) {
            creep.memory.stuck = 0;
        } else {
            creep.memory.stuck += 1;
        }
        creep.memory.lastPos = creep.pos;
    }
};