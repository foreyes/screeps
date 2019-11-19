var utils = require('utils');

var specialTypeList = {
	starter: function(ctx, creep) {
		var aliveExts = ctx.room.find(FIND_STRUCTURES, {
			filter: (s) => {
				return s.my && s.structureType == 'extension' && s.isActive();
			}
		});
		if(aliveExts.length > 0 && ctx.miners.length == 0) {
			return require('role_filler').Run(ctx, creep);
		}
		return require('role_builder').Run(ctx, creep);
	},
	graderKeeper: function(ctx, creep) {
		creep.memory.keepLevel = true;
		return require('role_upgrader').Run(ctx, creep);
	},
	terminalFiller: function(ctx, creep) {
		if(creep.memory.amount == undefined) return false;
		if(ctx.terminal == undefined) return false;
		if(ctx.terminal.store[RESOURCE_ENERGY] >= creep.memory.amount) return false;
		// get energy
		if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
			return require('role_filler').Run(ctx, creep);
		} else {
			var target = ctx.terminal;
			var err = creep.transfer(target, RESOURCE_ENERGY);
			if(err == ERR_NOT_IN_RANGE) {
				return utils.DefaultMoveTo(creep, target);
			}
			return err == 0;
		}
		return false;
	},
	// require('role_spawn').SpawnCreep('5da936cbff916207b35bb3b4', 'specialer', {directions: [TOP], parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], memory: {specialType: 'factorier'}});
	factorier: function(ctx, creep) {
		if(!ctx.factory) return false;
		if(creep.store.getUsedCapacity() == 0) {
			if(ctx.factory.store[RESOURCE_ENERGY] < 10000 || ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
				creep.say('creeper!');
				creep.withdraw(ctx.storage, RESOURCE_ENERGY);
			}
			if(ctx.factory.store[RESOURCE_LEMERGIUM] < 1000) {
				creep.withdraw(ctx.storage, RESOURCE_LEMERGIUM);
				creep.withdraw(ctx.terminal, RESOURCE_LEMERGIUM);
			}
			if(ctx.factory.store[RESOURCE_ZYNTHIUM] < 1000) {
				creep.withdraw(ctx.storage, RESOURCE_ZYNTHIUM);
				creep.withdraw(ctx.terminal, RESOURCE_ZYNTHIUM);
			}
			if(ctx.factory.store[RESOURCE_KEANIUM] < 1000) {
				creep.withdraw(ctx.storage, RESOURCE_KEANIUM);
				creep.withdraw(ctx.terminal, RESOURCE_KEANIUM);
			}
			if(ctx.factory.store[RESOURCE_MIST] < 1000) {
				creep.withdraw(ctx.storage, RESOURCE_MIST);
				creep.withdraw(ctx.terminal, RESOURCE_MIST);
			}
			creep.withdraw(ctx.factory, RESOURCE_LEMERGIUM_BAR);
			creep.withdraw(ctx.factory, RESOURCE_ZYNTHIUM_BAR);
			creep.withdraw(ctx.factory, RESOURCE_CONDENSATE);
		} else {
			if(ctx.factory.store[RESOURCE_ENERGY] < 10000) {
				creep.transfer(ctx.factory, RESOURCE_ENERGY);
			}
			if(ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
				creep.transfer(ctx.terminal, RESOURCE_ENERGY);
			}
			creep.transfer(ctx.factory, RESOURCE_LEMERGIUM);
			creep.transfer(ctx.factory, RESOURCE_ZYNTHIUM);
			creep.transfer(ctx.factory, RESOURCE_KEANIUM);
			creep.transfer(ctx.factory, RESOURCE_MIST);
			creep.transfer(ctx.terminal, RESOURCE_LEMERGIUM_BAR);
			creep.transfer(ctx.terminal, RESOURCE_ZYNTHIUM_BAR);
			creep.transfer(ctx.terminal, RESOURCE_CONDENSATE);
			return true;
		}
	},
};

function getResourceTargetFromStorageOrTerminal(ctx, creep, resouceType = RESOURCE_ENERGY) {
	if(ctx.storage && ctx.storage.store[resouceType] > 0) {
		return ctx.storage;
	}
	if(ctx.terminal && ctx.terminal.store[resouceType] > 0) {
		return ctx.terminal;
	}
	return null;
}

// require('role_specialer').spawnTermialFiller();
function spawnTermialFiller(spawnId = '5dc6d24401ce096f94fc8ea6', amount = 10000) {
	var spawn = Game.getObjectById(spawnId);
    return require('role_spawn').spawnCreep(spawn.room.ctx, spawn, 'specialer', {
        parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
        memory: {
            specialType: 'terminalFiller',
            amount: amount
        }
    });
}

function Run(ctx, creep) {
	var st = creep.memory.specialType;
	try {
		return specialTypeList[st](ctx, creep);
	} catch(err) {
		console.log('role_specialer: ' + err.stack);
	}
}

module.exports = {
	spawnTermialFiller,
    Run
};