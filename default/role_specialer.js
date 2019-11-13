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
};

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