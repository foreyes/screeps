var utils = require('utils');

function getRunningPair(pairInMemory) {
    var worker = Game.getObjectById(pairInMemory.workerId);
    var healer = Game.getObjectById(pairInMemory.healerId);
    var workFlag = Game.flags[pairInMemory.flagName];
    if(!worker || !healer) return null;
    return {worker: worker, healer: healer, workFlag: workFlag};
}

function isExit(pos) {
    return pos.x == 0 || pos.y == 0 || pos.x == 49 || pos.y == 49;
}

function moveWorker(worker, healer, workFlag) {
    // diff room
    if(worker.room.name != healer.room.name) {
        if(worker.room.name != workFlag.pos.roomName || !worker.pos.isNearTo(workFlag)) {
            return utils.DefaultMoveTo(worker, workFlag);
        }
    } else {
        // wait for healer
        if(!worker.pos.isNearTo(healer.pos)) return;
        // console.log(worker, workFlag);
        if(worker.room.name != workFlag.pos.roomName || !worker.pos.isNearTo(workFlag)) {
            return utils.DefaultMoveTo(worker, workFlag);
        }
    }
}

function moveHealer(worker, healer, workFlag) {
    utils.DefaultMoveTo(healer, worker);
}

function runPair(pair) {
    console.log('Running invader pair: ' + Game.time);
    var worker = pair.worker;
    var workerDamage = worker.hitsMax - worker.hits;
    var healer = pair.healer;
    var healerDamage = healer.hitsMax - healer.hits;
    var workFlag = pair.workFlag;

    // heal
    if(healer.room.name != worker.room.name) {
        healer.heal(healer);
    } else {
        // heal self
        if(healerDamage > workerDamage) {
            healer.heal(healer);
        } else {
            if(healer.pos.isNearTo(worker)) {
                healer.heal(worker);
            } else {
                healer.rangedHeal(worker);
            }
        }
    }
    // move
    utils.DefaultMoveTo(healer, worker);
    if(!workFlag) return;
    moveWorker(worker, healer, workFlag);
    // moveHealer(worker, healer, workFlag);

    if(worker.pos.isNearTo(workFlag)) {
        var structs = workFlag.pos.lookFor(LOOK_STRUCTURES);
        if(structs.length > 0) {
            worker.dismantle(structs[0]);
        }
    }
}

function Run() {
    if(Memory.invaderPairs == undefined) {
        Memory.invaderPairs = [];
    }
    var nxtInvaderPairs = [];
    for(var pair of Memory.invaderPairs) {
        var runningPair = getRunningPair(pair);
        if(runningPair) {
            nxtInvaderPairs.push(pair);
            runPair(runningPair);
        }
    }
    Memory.invaderPairs = nxtInvaderPairs;
}

function AttachInvaderPair(worker, healer, flagName) {
    worker.room.cache.boostPrepare = false;
    if(Memory.invaderPairs == undefined) {
        Memory.invaderPairs = [];
    }
    Memory.invaderPairs.push({workerId: worker.id, healerId: healer.id, flagName: flagName});
}

module.exports = {
    Run,
    AttachInvaderPair,
};