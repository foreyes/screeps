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
		if(ctx.centralLink && ctx.centralLink.store[RESOURCE_ENERGY] > 0 && creep.store.getFreeCapacity() > 0) {
			return creep.withdraw(ctx.centralLink, RESOURCE_ENERGY);
		}

		if(!ctx.factory) {
			if(creep.store.getUsedCapacity() == 0) {
				if(ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
					creep.say('creeper!');
					creep.withdraw(ctx.storage, RESOURCE_ENERGY);
				}
			} else {
				if(ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
					creep.transfer(ctx.terminal, RESOURCE_ENERGY);
				} else {
					creep.transfer(ctx.storage, RESOURCE_ENERGY);
				}
			}
			return false;
		}
		if(creep.store.getUsedCapacity() == 0 && creep.ticksToLive > 10) {
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
			if(ctx.factory.store[RESOURCE_OXYGEN] < 1000) {
				creep.withdraw(ctx.storage, RESOURCE_OXYGEN);
				creep.withdraw(ctx.terminal, RESOURCE_OXYGEN);
			}
			creep.withdraw(ctx.factory, RESOURCE_LEMERGIUM_BAR);
			creep.withdraw(ctx.factory, RESOURCE_ZYNTHIUM_BAR);
			creep.withdraw(ctx.factory, RESOURCE_CONDENSATE);
			creep.withdraw(ctx.factory, RESOURCE_OXIDANT);
			if(ctx.factory.store[RESOURCE_KEANIUM_BAR] > 10000) {
				creep.withdraw(ctx.factory, RESOURCE_KEANIUM_BAR);
			}
		} else {
			if(ctx.factory.store[RESOURCE_ENERGY] < 10000) {
				creep.transfer(ctx.factory, RESOURCE_ENERGY);
			}
			if(ctx.terminal.store[RESOURCE_ENERGY] < 10000) {
				creep.transfer(ctx.terminal, RESOURCE_ENERGY);
			}
			if(ctx.factory.store[RESOURCE_ENERGY] >= 10000 && ctx.factory.store[RESOURCE_ENERGY] >= 10000) {
				creep.transfer(ctx.storage, RESOURCE_ENERGY);
			}
			creep.transfer(ctx.factory, RESOURCE_LEMERGIUM);
			creep.transfer(ctx.factory, RESOURCE_ZYNTHIUM);
			creep.transfer(ctx.factory, RESOURCE_KEANIUM);
			creep.transfer(ctx.factory, RESOURCE_MIST);
			creep.transfer(ctx.factory, RESOURCE_OXYGEN);
			creep.transfer(ctx.terminal, RESOURCE_LEMERGIUM_BAR);
			creep.transfer(ctx.terminal, RESOURCE_ZYNTHIUM_BAR);
			creep.transfer(ctx.terminal, RESOURCE_CONDENSATE);
			creep.transfer(ctx.terminal, RESOURCE_OXIDANT);
			creep.transfer(ctx.terminal, RESOURCE_KEANIUM_BAR);
			return true;
		}
	},
	// require('role_spawn').SpawnCreep('5dc6d24401ce096f94fc8ea6', 'specialer', {parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], memory: {specialType: 'laber'}});
	laber: function(ctx, creep) {
		if(!ctx.labs) return false;
		if(creep.memory.status == undefined) {
			creep.memory.status = 'fill';
		}
		switch(creep.memory.status) {
		case 'fill': {
			var flag = true;
			for(var j in [0, 0]) {
				var i = parseInt(j) + 2;
				var resourceType = ctx.room.memory.ctx.labPlan[i];
				if(ctx.labs[i].store.getFreeCapacity(resourceType) > 0) {
					flag = false;
					break;
				}
			}
			if(flag) creep.memory.status = 'clear';
			break;
		}
		case 'clear': {
			if(creep.store.getUsedCapacity() == 0) {
				var flag = true;
				for(var i in [0, 0, 0, 0]) {
					var resourceType = ctx.room.memory.ctx.labPlan[i];
					if(ctx.labs[i].store[resourceType] != 0) {
						flag = false;
						break;
					}
				}
				if(flag) creep.memory.status = 'fill';
			}
			break;
		}
		}

		switch(creep.memory.status) {
		case 'fill': {
			if(creep.store.getFreeCapacity() > 0 && creep.ticksToLive > 100) {
				for(var i in [0, 0]) {
					var resourceType = ctx.room.memory.ctx.labPlan[i];
					if(ctx.labs[i].store[resourceType] < 1000) {
						if(utils.GetResourceFromStorageAndTerminal(ctx, creep, resourceType)) {
							return true;
						}
					}
				}
				return false;
			} else {
				var target = null;
				var targetResourceType = null;
				if(!target) {
					for(var i in [0, 0]) {
						var resourceType = ctx.room.memory.ctx.labPlan[i];
						if(creep.store[resourceType] > 0 && ctx.labs[i].store.getFreeCapacity(resourceType) > 0) {
							target = ctx.labs[i];
							targetResourceType = resourceType;
							break;
						}
					}
				}
				if(!target) return false;

				var err = creep.transfer(target, targetResourceType);
				if(err == ERR_NOT_IN_RANGE) {
					utils.DefaultMoveTo(creep, target);
					return true;
				}
				return err == 0;
			}
			break;
		}
		case 'clear': {
			if(creep.store.getFreeCapacity() > 0 && creep.ticksToLive > 100) {
				for(var i in [0, 0, 0, 0]) {
					var resourceType = ctx.room.memory.ctx.labPlan[i];
					if(ctx.labs[i].store[resourceType] > 0) {
						var target = ctx.labs[i];
						var err = creep.withdraw(target, resourceType);
					    if(err == ERR_NOT_IN_RANGE) {
					        utils.DefaultMoveTo(creep, target);
					        return true;
					    }
					    if(err == 0) return true;
					}
				}
				return false;
			} else {
				var target = null;
				var targetResourceType = null;
				for(var i in [0, 0, 0, 0]) {
					var resourceType = ctx.room.memory.ctx.labPlan[i];
					if(creep.store[resourceType] > 0) {
						target = ctx.terminal;
						targetResourceType = resourceType;
						break;
					}
				}
				if(!target) return false;
				
				var err = creep.transfer(target, targetResourceType);
				if(err == ERR_NOT_IN_RANGE) {
					utils.DefaultMoveTo(creep, target);
					return true;
				}
				return err == 0;
			}
			break;
		}
		}
	},
	stealer: function(ctx, creep) {
		if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
			if(!Game.flags['stealFlag']) return false;
			var flag = Game.flags['stealFlag'];
			if(creep.room.name != flag.room.name) {
				utils.DefaultMoveTo(creep, flag);
				return true;
			}
			if(creep.withdraw(flag.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				utils.DefaultMoveTo(creep, flag.room.storage);
				return true;
			}
		} else {
			if(creep.room.name != ctx.room.name) {
				utils.DefaultMoveTo(creep, ctx.storage);
				return true;
			}
			if(creep.transfer(ctx.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				utils.DefaultMoveTo(creep, ctx.storage);
				return true;
			}
		}
	},
};

function getResourceTargetFromStorageOrTerminal(ctx, creep, resourceType = RESOURCE_ENERGY) {
	if(ctx.storage && ctx.storage.store[resourceType] > 0) {
		return ctx.storage;
	}
	if(ctx.terminal && ctx.terminal.store[resourceType] > 0) {
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