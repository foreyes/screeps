var utils = require('utils');
var FactoryConfig = require('factory_config');

function GetPartsAndCost(energy) {
    if(energy < 800) {
        return {cost: 0, parts: []};
    } else {
        return {cost: 800, parts: utils.GetPartsByArray([[CARRY, 16]])};
    }
}

function fetchFactoryConfig(factory) {
    factory.need = {};
    factory.produceList = {};
    var roomName = factory.room.name;
    if(FactoryConfig[roomName] == undefined) {
        return 0;
    }
    if(FactoryConfig[roomName].need != undefined) {
        factory.need = FactoryConfig[roomName].need;
    }
    if(FactoryConfig[roomName].produceList != undefined) {
        factory.produceList = FactoryConfig[roomName].produceList;
    }
    return 0;
}

function getNewWork(ctx, creep) {
    // tansfer energy for link
    if(!ctx.storage) return;
    if(ctx.centralLink && ctx.centralLink.store[RESOURCE_ENERGY] > 0) {
        creep.say('0');
        return creep.memory.work = {
            srcId: ctx.centralLink.id,
            destId: ctx.storage.id,
            resourceType: RESOURCE_ENERGY,
        };
    }
    if(!ctx.terminal) return;
    if(ctx.storage.store[RESOURCE_ENERGY] > 50000 && ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
        creep.say('1');
        return creep.memory.work = {
            srcId: ctx.storage.id,
            destId: ctx.terminal.id,
            resourceType: RESOURCE_ENERGY,
        }
    }
    if(ctx.terminal.store[RESOURCE_ENERGY] > 5000 && ctx.storage.store[RESOURCE_ENERGY] < 10000) {
        creep.say('2');
        return creep.memory.work = {
            srcId: ctx.terminal.id,
            destId: ctx.storage.id,
            resourceType: RESOURCE_ENERGY,
        }
    }

    // supply power spawn
    if(ctx.powerSpawn && creep.pos.isNearTo(ctx.powerSpawn)) {
        if(ctx.powerSpawn.store[RESOURCE_POWER] == 0 && ctx.terminal.store[RESOURCE_POWER] > 0) {
            creep.say('3');
            return creep.memory.work = {
                srcId: ctx.terminal.id,
                destId: ctx.powerSpawn.id,
                resourceType: RESOURCE_POWER,
                amount: 100,
            }
        }
        if(ctx.powerSpawn.store[RESOURCE_ENERGY] < 4000 && ctx.storage.store[RESOURCE_ENERGY] >= 300000) {
            creep.say('4');
            return creep.memory.work = {
                srcId: ctx.storage.id,
                destId: ctx.powerSpawn.id,
                resourceType: RESOURCE_ENERGY,
                amount: 800,
            }
        }
        if(ctx.powerSpawn.store[RESOURCE_ENERGY] < 4000 && ctx.terminal.store[RESOURCE_ENERGY] >= 20000) {
            creep.say('4');
            return creep.memory.work = {
                srcId: ctx.terminal.id,
                destId: ctx.powerSpawn.id,
                resourceType: RESOURCE_ENERGY,
                amount: 800,
            }
        }
    }

    // tansfer between factory and terminal
    if(ctx.factory) {
        for(var resourceType in ctx.factory.need) {
            if(ctx.factory.store[resourceType] < ctx.factory.need[resourceType] &&
                ctx.terminal.store[resourceType] > 0) {
                creep.say('5');
                return creep.memory.work = {
                    srcId: ctx.terminal.id,
                    destId: ctx.factory.id,
                    resourceType: resourceType,
                }
            }
        }
        // withdraw from factory
        for(var resourceType in ctx.factory.store) {
            if(!ctx.factory.need[resourceType]) {
                creep.say('6');
                return creep.memory.work = {
                    srcId: ctx.factory.id,
                    destId: ctx.terminal.id,
                    resourceType: resourceType,
                };
            }
            var limitAmount = Math.max(ctx.factory.need[resourceType] * 2, 2000);
            if(ctx.factory.store[resourceType] > limitAmount) {
                creep.say('7');
                return creep.memory.work = {
                    srcId: ctx.factory.id,
                    destId: ctx.terminal.id,
                    resourceType: resourceType,
                };
            }
        }
    }
    // transfer energy between terminal and storage
    // we assume a room need energy when its terminal.need[RESOURCE_ENERGY] >= 100000
    var roomNeedEnergy = ctx.terminal.need && ctx.terminal.need[RESOURCE_ENERGY] >= 100000;
    var tooMuchEnergyInTerminal = !ctx.terminal.need || !ctx.terminal.need[RESOURCE_ENERGY] ||
        ctx.terminal.store[RESOURCE_ENERGY] > ctx.terminal.need[RESOURCE_ENERGY] * 2;
    var storageEmpty = ctx.storage.store[RESOURCE_ENERGY] < 10000;
    var terminalNeedEnergy = ctx.terminal.store[RESOURCE_ENERGY] < 10000;
    if((storageEmpty && ctx.terminal.store[RESOURCE_ENERGY] >= 30000) ||
        (roomNeedEnergy && ctx.terminal.store[RESOURCE_ENERGY] >= 50000)) {
        creep.say('8');
        return creep.memory.work = {
            srcId: ctx.terminal.id,
            destId: ctx.storage.id,
            resourceType: RESOURCE_ENERGY,
        };
    }
    if(terminalNeedEnergy || (!roomNeedEnergy && ctx.storage.store[RESOURCE_ENERGY] > 500000 && ctx.terminal.store.getFreeCapacity() > 50000)) {
        creep.say('9');
        return creep.memory.work = {
            srcId: ctx.storage.id,
            destId: ctx.terminal.id,
            resourceType: RESOURCE_ENERGY,
        };
    }
}

function doWork(ctx, creep, src, dest, resourceType, amount) {
    if(creep.store[resourceType] == 0) {
        if(src.store[resourceType] > 0) {
            if(amount) {
                creep.withdraw(src, resourceType, Math.min(amount, src.store[resourceType]));
            } else {
                creep.withdraw(src, resourceType);
            }
            return -1;
        } else {
            // end work
            return 0;
        }
    } else {
        var condition = false;
        // check special storage
        if(dest.store.getUsedCapacity() == null) {
            condition = dest.store.getFreeCapacity(resourceType) > 0;
        } else {
            condition = dest.store.getFreeCapacity() > 0;
        }
        if(condition) {
            if(amount) {
                return creep.transfer(dest, resourceType, Math.min(amount, creep.store[resourceType]));
            } else {
                return creep.transfer(dest, resourceType);
            }
        } else {
            return 0;
        }
    }
}

function runProduce(factory) {
    if(factory.cooldown) return;
    for(var resourceType of factory.produceList) {
        var err = factory.produce(resourceType);
        if(err == 0) {
            return;
        }
    }
}

function Run(ctx, creep) {
    if(creep.spawning) return;
    if(ctx.factory) {
        fetchFactoryConfig(ctx.factory);
        runProduce(ctx.factory);
    }
    if(creep.memory.work == undefined) {
        // no work, but something still in store.
        if(creep.store.getUsedCapacity() > 0) {
            var target = ctx.terminal;
            if(!target) target = ctx.storage;
            if(!target) return -1241;
            for(var resourceType in creep.store) {
                creep.transfer(target, resourceType);
                return 0;
            }
        } else if(creep.ticksToLive > 10){
            getNewWork(ctx, creep);
        } else {
            creep.suicide();
        }
    }
    if(creep.memory.work == undefined) return 0;

    var src = Game.getObjectById(creep.memory.work.srcId);
    var dest = Game.getObjectById(creep.memory.work.destId);
    var err = doWork(ctx, creep, src, dest, creep.memory.work.resourceType, creep.memory.work.amount);
    if(err == 0) {
        delete creep.memory.work;
    }
}

module.exports = {
    Run,
    GetPartsAndCost,
};