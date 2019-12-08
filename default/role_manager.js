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
		return creep.memory.work = {
			srcId: ctx.centralLink.id,
			destId: ctx.storage.id,
			resourceType: RESOURCE_ENERGY,
		};
	}
	if(!ctx.terminal) return;
	if(ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
		return creep.memory.work = {
			srcId: ctx.storage.id,
			destId: ctx.terminal.id,
			resourceType: RESOURCE_ENERGY,
		}
	}

	// tansfer between factory and terminal
	if(ctx.factory) {
		for(var resourceType in ctx.factory.need) {
			if(ctx.factory.store[resourceType] < ctx.factory.need[resourceType] &&
				ctx.terminal.store[resourceType] > 0) {
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
				return creep.memory.work = {
					srcId: ctx.factory.id,
					destId: ctx.terminal.id,
					resourceType: resourceType,
				};
			}
			var limitAmount = Math.max(ctx.factory.need[resourceType] * 2, 2000);
			if(ctx.factory.store[resourceType] > limitAmount) {
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
	if((storageEmpty && ctx.terminal.store[RESOURCE_ENERGY] >= 30000) ||
		(roomNeedEnergy && ctx.terminal.store[RESOURCE_ENERGY] >= 50000)) {
		return creep.memory.work = {
			srcId: ctx.terminal.id,
			destId: ctx.storage.id,
			resourceType: RESOURCE_ENERGY,
		};
	}
	if(!roomNeedEnergy && ctx.storage.store[RESOURCE_ENERGY] > 500000 && ctx.terminal.store.getFreeCapacity() > 50000) {
		return creep.memory.work = {
			srcId: ctx.storage.id,
			destId: ctx.terminal.id,
			resourceType: RESOURCE_ENERGY,
		};
	}
}

function doWork(ctx, creep, src, dest, resourceType) {
	if(creep.store[resourceType] == 0) {
		if(src.store[resourceType] > 0) {
			creep.withdraw(src, resourceType);
			return -1;
		} else {
			// end work
			return 0;
		}
	} else {
		if(dest.store.getFreeCapacity() >= creep.store[resourceType]) {
			return creep.transfer(dest, resourceType);
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
	var err = doWork(ctx, creep, src, dest, creep.memory.work.resourceType);
	if(err == 0) {
		delete creep.memory.work;
	}
}

module.exports = {
    Run,
    GetPartsAndCost,
};