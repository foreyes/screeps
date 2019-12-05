var utils = require('utils');

var roleParts = {
	0: [],
    300: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    450: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    550: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    750: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    900: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1050: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    1200: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    2500: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
};

function getCost(energy, flag = false) {
	if(energy >= 2500 && flag) return 2500;
	if(energy >= 1200) return 1200;
	if(energy >= 1050) return 1050;
	if(energy >= 900) return 900;
	if(energy >= 750) return 750;
	if(energy >= 550) return 550;
	if(energy >= 450) return 450;
	if(energy >= 300) return 300;
	return 0;
}

function GetPartsAndCost(energy, ctx = {}) {
	var cost = getCost(energy, ctx.upgrading);
	var parts = roleParts[cost];
	return {cost: cost, parts: parts};
}

function isValidTarget(ctx, creep, target) {
	if(!target) return false;
	if(ctx.controllerContainer && target.id == ctx.controllerContainer.id) {
		return target.store.getFreeCapacity(RESOURCE_ENERGY) >= Math.min(800, creep.store.getCapacity(RESOURCE_ENERGY));
	}
	return target.store && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
}

function findNewTarget(ctx, creep) {
	if(ctx.upgrading && ctx.controllerContainer && ctx.fillers.length > 0 && ctx.fillers[0].id != creep.id) {
		return ctx.controllerContainer;
	}
	if(ctx.storage && ctx.storage.store[RESOURCE_ENERGY] >= 2000 && ctx.towers) {
		var emptyTowers = ctx.towers.filter((t) => t.store[RESOURCE_ENERGY] < 500);
		if(emptyTowers.length > 0) {
			return creep.pos.findClosestByPath(emptyTowers);
		}
	}
	// fill spawn and extensions
	var spwansAndEmptyExts = [];
	if(ctx.emptyExts) {
		spwansAndEmptyExts = spwansAndEmptyExts.concat(ctx.emptyExts);
	}
	if(ctx.spawns) {
		var emptySpawns = ctx.spawns.filter((s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
		spwansAndEmptyExts = spwansAndEmptyExts.concat(emptySpawns);
	}
	if(spwansAndEmptyExts.length != 0) {
		return creep.pos.findClosestByPath(spwansAndEmptyExts);
	}
	// fill tower
	if(ctx.towers) {
		var emptyTowers = ctx.towers.filter((t) => t.store[RESOURCE_ENERGY] < 500);
		if(emptyTowers.length > 0) {
			return creep.pos.findClosestByPath(emptyTowers);
		}
	}
	// fill controller's container
	if(ctx.controllerContainer) {
		if(ctx.upgrading) {
			return ctx.controllerContainer;
		} else if(ctx.controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) >= Math.min(800, creep.store.getCapacity(RESOURCE_ENERGY))) {
			return ctx.controllerContainer;
		}
	}
	// fill storage
	if(ctx.storage && ctx.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		return ctx.storage;
	}
	// fill central containers
	if(ctx.centralContainers) {
		var containers = _.filter(ctx.centralContainers, (c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
		if(containers.length > 0) {
			return creep.pos.findClosestByPath(containers);
		}
	}
	return null;
}

function getValidTarget(ctx, creep) {
	var target = Game.getObjectById(creep.memory.targetId);
	if(!isValidTarget(ctx, creep, target)) {
		delete creep.memory.targetId;
		target = findNewTarget(ctx, creep);
	}
	if(target != null && target != ctx.storage) {
		creep.memory.targetId = target.id;
	}
	creep.target = target;
	return target;
}

function isImportantTarget(ctx, target) {
	if(ctx.storage && target.id == ctx.storage.id) return false;
	if(ctx.centralContainers) {
		for(var i in ctx.centralContainers) {
			if(ctx.centralContainers[i].id == target.id) return false;
		}
	}
	return true;
}

function findEnergy(ctx, creep) {
	if(!creep.memory.FindEnergy) {
		creep.memory.FindEnergy = true;
		creep.say('🔄');
		delete creep.memory.energyTargetId;
		delete creep.memory.targetId;
	}
	var target = getValidTarget(ctx, creep);
	if(target == null) return;

	if(isImportantTarget(ctx, target)) {
		creep.say('hi');
		if(utils.GetEnergy4ImportantTarget(ctx, creep)) return;
	}

	if(utils.GetEnergy4Filler(ctx, creep, target.id)) return;
	if(ctx.miners.length != 0 || creep.getActiveBodyparts(WORK) == 0) return;

	var source = ctx.sources[0];
	var err = creep.harvest(source);
	if(err == ERR_NOT_IN_RANGE) {
		utils.DefaultMoveTo(creep, source);
	}
}

function fillStructure(ctx, creep) {
	if(creep.store[RESOURCE_ENERGY] == 0) {
		creep.memory.FindEnergy = true;
		return false;
	}
	var target = getValidTarget(ctx, creep);
	if(target == null) return false;

	if(ctx.upgrading && ctx.controllerContainer && target.id == ctx.controllerContainer.id && creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
		creep.memory.FindEnergy = true;
		findEnergy(ctx, creep);
		return false;
	}

	var err = creep.transfer(target, RESOURCE_ENERGY);
	if(err == ERR_NOT_IN_RANGE) {
		utils.DefaultMoveTo(creep, target);
	} else {
		return err == 0;
	}
	return true;
}


function Run(ctx, creep) {
	creep.st = Game.cpu.getUsed();
	if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		var energy = creep.room.lookAt(creep.pos).filter((item) => {
			return item.type == 'resource' && item.resource.amount > 0 && item.resource.resourceType == RESOURCE_ENERGY;
		});
		if(energy.length > 0) {
			creep.pickup(energy[0].resource);
		}
	}
	if(creep.memory.FindEnergy && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
		creep.memory.FindEnergy = false;
		creep.say('store');
		delete creep.memory.energyTargetId;
		delete creep.memory.targetId;
	}
	if(creep.store[RESOURCE_ENERGY] == 0 || creep.memory.FindEnergy) {
		findEnergy(ctx, creep);
		return;
	}
	if(fillStructure(ctx, creep)) {
		return;
	}
	// no work to do
	// TODO: set a rest point
	utils.DefaultMoveTo(creep, ctx.restPos);
}

module.exports = {
	GetPartsAndCost,
	Run
};