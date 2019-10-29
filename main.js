// TODOs: suicade logic, fix find energy then store, refactor ctx, recycle droped energy
// build err, stats road, refactor stages, extension use, reuse carrier and spawner
// get position by dist, tower logic, wall and rampart

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
    tower: require('role_tower'),
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
// set a restPos Flag
module.exports.loop = function () {
    var ctx = fetchCtx();

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
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

    // extra
    if(Memory.ctx.ExtraWork && Memory.ctx.ExtraWork.length > 0) {
        var newExt = [];
        for(var i in Memory.ctx.ExtraWork) {
            var workPair = Memory.ctx.ExtraWork[i];
            var creep = Game.getObjectById(workPair.id);
            if(!creep) continue;
            if(workPair.type == 'walk') {
                var target = new RoomPosition(workPair.target.x, workPair.target.y, workPair.target.roomName);
                if(!utils.IsSamePosition(creep.pos, target)) {
                    utils.DefaultMoveTo(creep, target);
                    newExt.push(workPair);
                }
            } else if(workPair.type == 'attack') {
                var target = Game.getObjectById(workPair.target);
                if(!target) continue;
                var err = creep.attack(target);
                if(err == ERR_NOT_IN_RANGE) {
                    utils.DefaultMoveTo(creep, target);
                }
                newExt.push(workPair);
            }
            
        }
        Memory.ctx.ExtraWork = newExt;
    }
};