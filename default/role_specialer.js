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
			}
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

			break;
		}
		}
	},
	powerSpawner: function(ctx, creep) {
		if(!ctx.powerSpawn) return;

		if(creep.store[RESOURCE_POWER] > 0 && ctx.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 50) {
			var err = creep.transfer(ctx.powerSpawn, RESOURCE_POWER);
			if(err == 0) return;
			if(err == ERR_NOT_IN_RANGE) {
				return utils.DefaultMoveTo(creep, ctx.powerSpawn);
			}
		}
		if(creep.store[RESOURCE_ENERGY] > 0 &&ctx.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
			var err = creep.transfer(ctx.powerSpawn, RESOURCE_ENERGY);
			if(err == 0) return;
			if(err == ERR_NOT_IN_RANGE) {
				return utils.DefaultMoveTo(creep, ctx.powerSpawn);
			}
		}

		if(creep.ticksToLive >= 100) {
			var limit = creep.store.getCapacity();
			if(creep.store[RESOURCE_POWER] < 100 && ctx.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 0 && ctx.terminal.store[RESOURCE_POWER] >= 100) {
				var err = creep.withdraw(ctx.terminal, RESOURCE_POWER, 100 - creep.store[RESOURCE_POWER]);
				if(err == 0) return;
				if(err == ERR_NOT_IN_RANGE) {
					return utils.DefaultMoveTo(creep, ctx.terminal);
				}
			}
			if(creep.store[RESOURCE_ENERGY] < limit - 100 && ctx.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
				var err = creep.withdraw(ctx.storage, RESOURCE_ENERGY, limit - 100 - creep.store[RESOURCE_ENERGY]);
				if(err == 0) return;
				if(err == ERR_NOT_IN_RANGE) {
					return utils.DefaultMoveTo(creep, ctx.storage);
				}
			}
		} else if(creep.store.getUsedCapacity() == 0) {
			return creep.suicide();
		}
	},
	boostHelper: function(ctx, creep) {
		const labNum = 7;
		if(ctx.labs.length < labNum) return false;
		var resourceList = ['XGHO2', 'XLHO2', 'XKHO2', 'XZHO2', 'XUH2O', 'XZH2O', 'XKH2O'];
		if(creep.store[RESOURCE_ENERGY] + ctx.terminal.store[RESOURCE_ENERGY] > 0) {
			for(var i = 0; i < labNum; i++) {
				var lab = ctx.labs[i];
				if(lab.store[RESOURCE_ENERGY] < 1500) {
					if(creep.store[RESOURCE_ENERGY] > 0) {
						if(!creep.pos.isNearTo(lab)) {
							return utils.DefaultMoveTo(creep, lab);
						}
						return creep.transfer(lab, RESOURCE_ENERGY);
					} else {
						if(!creep.pos.isNearTo(ctx.terminal)) {
							return utils.DefaultMoveTo(creep, ctx.terminal)
						}
						return creep.withdraw(ctx.terminal, RESOURCE_ENERGY);
					}
				}
			}
		}
		for(var i = 0; i < labNum; i++) {
			var resourceType = resourceList[i];
			var lab = ctx.labs[i];
			if(lab.store[resourceType] < 2000) {
				if(creep.store[resourceType] > 0) {
					if(!creep.pos.isNearTo(lab)) {
						return utils.DefaultMoveTo(creep, lab)
					}
					return creep.transfer(lab, resourceType);
				} else {
					if(ctx.terminal.store[resourceType] == 0) {
						continue;
					}
					if(!creep.pos.isNearTo(ctx.terminal)) {
						return utils.DefaultMoveTo(creep, ctx.terminal)
					}
					return creep.withdraw(ctx.terminal, resourceType);
				}
			}
		}
		var flag = true;
		for(var i = 0; i < labNum; i++) {
			var resourceType = resourceList[i];
			var lab = ctx.labs[i];
			if(lab.store[resourceType] < 1000) {
				flag = false;
				break;
			}
			if(lab.store[RESOURCE_ENERGY] < 1500) {
				flag = false;
				break;
			}
		}
		if(flag) {
			ctx.room.cache.boostPrepare = true;
		}
		if(!creep.pos.isEqualTo(Game.flags['helperPos'])) {
			return utils.DefaultMoveTo(creep, Game.flags['helperPos']);
		}

		return false;
	}
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