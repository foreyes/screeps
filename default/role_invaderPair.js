/*
useage:
    1. Ensure 'Run' function is executed every tick.
    2. Call 'AttachInvaderPair(worker, healer, flagName)' to create an invader pair.
        Eg. AttachInvaderPair(Game.getObjectById(workerId), Game.getObjectById(healerId), 'Destination');
       They will move to the flag, and attack/dismantle it.
    3. Change 'moveFunc' to your own move function.
    4. Change 'moveInit' to your init function which will be called before move. If you don't need this part, change it into a blank function.

PS:
    1. If there is no such flag, worker will stop move and attack/dismantle.
    2. Healer will follow worker, but it will still be attacked when closer to enemy. So you may need to remove the 
       flag and adjust the position manually when worker is near to the target.
    3. You can Re flag after arriving at the target place.
*/

/*
Please edit these two functions!!!!!!!!!!!!!!!!!!
Example:

const moveFunc = (creep, target) => {
    creep.moveTo(target);
};
const moveInit = () => {};
*/

const moveFunc = require('utils').DefaultMoveTo;
const moveInit = function() {
    require('cache');
    worker.fetchCache();
    healer.fetchCache();
};

//-------------------------------------------------------------------------------------------------------

function getRunningPair(pairInMemory) {
    var worker = Game.getObjectById(pairInMemory.workerId);
    var healer = Game.getObjectById(pairInMemory.healerId);
    var workFlag = Game.flags[pairInMemory.flagName];
    if(!worker || !healer) return null;
    return {worker: worker, healer: healer, workFlag: workFlag};
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
            return moveFunc(worker, workFlag);
        }
    } else {
        // wait for healer
        if(!worker.pos.isNearTo(healer.pos)) return;
        // console.log(worker, workFlag);
        if(worker.room.name != workFlag.pos.roomName || needMove(worker, workFlag)) {
            return moveFunc(worker, workFlag);
        }
    }
}

function moveHealer(worker, healer, workFlag) {
    moveFunc(healer, worker);
}

function runPair(pair) {
    // console.log('Running invader pair: ' + Game.time);
    var worker = pair.worker;
    var workerDamage = worker.hitsMax - worker.hits;
    var healer = pair.healer;
    var healerDamage = healer.hitsMax - healer.hits;
    var workFlag = pair.workFlag;

    // init function for move
    moveInit();

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
    moveFunc(healer, worker);
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
    // worker.room.cache.boostPrepare = false;
    if(Memory.invaderPairs == undefined) {
        Memory.invaderPairs = [];
    }
    Memory.invaderPairs.push({workerId: worker.id, healerId: healer.id, flagName: flagName});
}

module.exports = {
    Run,
    AttachInvaderPair,
};