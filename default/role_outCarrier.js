var utils = require('utils');

function getCost(energy) {
	var res = (Math.min(parseInt((energy-200) / 150), 15) * 150 + 200);
	if(res < 200) return 0;
	return res;
}

function GetPartsAndCost(energy) {
    var cost = getCost(energy);
    if(cost == 0) {
    	return {cost: 0, parts: []};
    }
    var cnt = Math.max(parseInt((cost-200) / 150), 0);
    var parts = utils.GetPartsByArray([[CARRY, cnt*2+1], [WORK, 1], [MOVE, cnt+1]]);
    return {cost: cost, parts: parts};
}

function Run(ctx, creep) {
	if(Game.cpu.bucket < 2000) return -233;
	if(creep.memory.store) {
		if(creep.store[RESOURCE_ENERGY] > 0) {
			// repair road
			if(creep.getActiveBodyparts(WORK) > 0) {
				var repaires = creep.room.lookAt(creep.pos).filter((item) => {
						return item.type == 'structure' && item.structure.hits < item.structure.hitsMax && item.structure.structureType == STRUCTURE_ROAD;
					}
				);
				if(repaires.length > 0) {
					var target = repaires[0].structure;
					var err = creep.repair(target);
					if(err == 0 && target.hitsMax - target.hits > 100 && !creep.memory.goBack) {
						return 0;
					}
				}
			}
			// transfer energy
			var target = Game.rooms[creep.memory.ctrlRoom].storage;
			var err = creep.transfer(target, RESOURCE_ENERGY);
			if(err == ERR_NOT_IN_RANGE) {
				return utils.DefaultMoveTo(creep, target);
			}
			if(err == 0) {
				if(Memory.statOutMiner == undefined) {
					Memory.statOutMiner = 0;
				}
				Memory.statOutMiner += creep.store[RESOURCE_ENERGY];
			}
			return err;
		} else {
			creep.memory.store = false;
		}
	}
	if(creep.ticksToLive < 100) {
		creep.memory.store = true;
		creep.memory.goBack = true;
		if(creep.store[RESOURCE_ENERGY] == 0) {
			creep.suicide();
		}
		return true;
	}

	var outSource = require('room_config')[creep.memory.ctrlRoom].outSources[creep.memory.workRoom];
	// been attacked
	if(creep.hits < creep.hitsMax) {
		var defender = Game.creeps['defender' + creep.memory.workRoom];
		if(!defender) {
			outSource.needDefender = true;
		}
		creep.memory.sleep = 100;
		var pos = ctx.spawn.pos;
		return utils.DefaultMoveTo(creep, pos);
	}
	// sleep after attacked
	if(creep.memory.sleep != undefined && creep.memory.sleep > 0) {
		creep.memory.sleep -= 1;
		return -555;
	}
	// go to work room
	var idx = creep.memory.sourceIdx;
	var workPos = utils.GetRoomPosition(outSource.workPos[idx]);
	if(creep.room.name != creep.memory.workRoom) {
		creep.say('hh');
		creep.say(workPos.roomName);
		return utils.DefaultMoveTo(creep, workPos);
	}
	// collect energy
	if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		// pick up energy
		var err = -233;
		var droppedEnergy = creep.room.lookAt(workPos).filter((item) => {
			return item.type == 'resource' && item.resource.resourceType == RESOURCE_ENERGY && item.resource.amount > 100;
		});
		if(droppedEnergy.length > 0) {
			var target = droppedEnergy[0].resource;
			err = creep.pickup(target);
		}
		if(err == 0) {
			return 0;
		}
		// withdraw container
		err = -233;
		var containers = creep.room.lookAt(workPos).filter((item) => {
			return item.type == 'structure' && item.structure.structureType == STRUCTURE_CONTAINER;
		});
		if(containers.length > 0) {
			var target = containers[0].structure;
			err = creep.withdraw(target, RESOURCE_ENERGY);
		}
		if(err == ERR_NOT_IN_RANGE) {
			return utils.DefaultMoveTo(creep, workPos);
		}
		if(err == 0) {
			return 0;
		}
	} else {
		creep.memory.store = true;
	}
}

module.exports = {
	GetPartsAndCost,
    Run
};