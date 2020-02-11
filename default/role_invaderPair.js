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

function needMove(worker, workFlag) {
    if(worker.room.name != workFlag.pos.roomName) return true;
    var ra = worker.getActiveBodyparts(RANGED_ATTACK) > 0;
    return (ra && !worker.pos.inRangeTo(workFlag, 3)) ||
            (!ra && !worker.pos.isNearTo(workFlag));
}

function moveWorker(worker, healer, workFlag) {
    // diff room
    if(worker.room.name != healer.room.name) {
        if(worker.room.name != workFlag.pos.roomName || needMove(worker, workFlag)) {
            return utils.DefaultMoveTo(worker, workFlag);
        }
    } else {
        // wait for healer
        if(!worker.pos.isNearTo(healer.pos)) return;
        // console.log(worker, workFlag);
        if(worker.room.name != workFlag.pos.roomName || needMove(worker, workFlag)) {
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

    require('cache');
    worker.fetchCache();
    healer.fetchCache();

    // heal
    if(healer.room.name != worker.room.name) {
        healer.heal(healer);
    } else {
        // heal self
        if(healerDamage > workerDamage && worker.getActiveBodyparts(HEAL) == 0) {
            healer.heal(healer);
        } else {
            if(healer.pos.isNearTo(worker)) {
                healer.heal(worker);
            } else {
                healer.rangedHeal(worker);
            }
        }
    }
    if(worker.getActiveBodyparts(HEAL) > 0) {
        if(healerDamage > 0 || worker.getActiveBodyparts(RANGED_ATTACK) > 0) {
            worker.heal(healer);
        }
    }
    // move
    utils.DefaultMoveTo(healer, worker);
    if(!workFlag) return;
    moveWorker(worker, healer, workFlag);
    // moveHealer(worker, healer, workFlag);

    if(needMove(worker, workFlag)) return;

    var structs = workFlag.pos.lookFor(LOOK_STRUCTURES);
    var rams = structs.filter((s) => s.structureType == STRUCTURE_RAMPART);
    if(rams.length > 0) {
        worker.dismantle(rams[0]);
        worker.attack(rams[0]);
        worker.rangedAttack(rams[0]);
    } else if(structs.length > 0) {
        worker.dismantle(structs[0]);
        worker.attack(structs[0]);
        worker.rangedAttack(structs[0]);
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