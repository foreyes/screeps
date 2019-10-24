var utils = require('utils');
var stages = require('stage_scheduler').stages;

var roleMap = {
    spawn: require('role_spawn'),
    workerHarvester: require('role_harvester'),
    workerUpgrader: require('role_upgrader'),
    workerRepairer: require('role_repairer'),
    workerBuilder: require('role_builder'),
    spawner: require('role_spawner'),
    carrier: require('role_carrier'),
    miner: require('role_miner'),
};

function fetchCtx() {
    if(Memory.ctx == undefined) {
        require('context').InitWhenRespawn();
    }
    return require('context').FetchCtx();
}

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

    var tower = Game.getObjectById('5dad1fabb3358f54b9fb903c');
    var enemy = ctx.room.find(FIND_CREEPS, {
        filter: (creep) => {
            return !creep.my;
        }
    });
    if(enemy.length != 0) {
        var target = tower.pos.findClosestByRange(enemy);
        tower.attack(target);
    }

    // run scheduler logic
    var newWait = [], ready = [];
    for(var i in Memory.ctx.Wait) {
        var x = Memory.ctx.Wait[i];
        if(x.wait == 0) {
            ready.push(x.name);
        } else {
            newWait.push(x);
        }
    }
    Memory.ctx.Wait = newWait;
    for(var i in ready) {
        var name = ready[i];
        var stage = stages[name];
        stage.init(ctx, stage.next);
        Memory.ctx.InProgress.push(name);
    }
    var newInProgress = [];
    for(var i in Memory.ctx.InProgress) {
        var name = Memory.ctx.InProgress[i];
        var stage = stages[name];
        if(stage.loop(ctx)) {
            stage.terminate(ctx, stage.next);
        } else {
            newInProgress.push(name);
        }
    }
    Memory.ctx.InProgress = newInProgress;


    // run role logic.
    var spawn = ctx.spawn, room = ctx.room;

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
    roleMap['spawn'].Run(ctx, spawn)
};