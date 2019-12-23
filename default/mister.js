var utils = require('utils');

var mistWorkParts = 20; 

function GetPartsAndCost(energy, ctx = {}) {
	if(!ctx.room || !ctx.room.controller) {
		return {cost: 0, parts: []};
	}
	var cl = ctx.room.controller.level;
	if(cl < 6) {
		return {cost: 0, parts: []};
	}
	if(cl == 6){
		if(energy < 1900) {
			return {cost: 0, parts: []};
		} else {
			return {cost: 1900, parts: utils.GetPartsByArray([[WORK, 10], [CARRY, 4], [MOVE, 14]])};
		}
	} else {
		if(energy < 3500) {
			return {cost: 0, parts: []};
		} else {
			return {cost: 3500, parts: utils.GetPartsByArray([[WORK, mistWorkParts], [CARRY, 5], [MOVE, 25]])};
		}
	}
}

function Run(ctx, creep) {
	switch(creep.memory.status) {
	case 'toWork': {
		if(creep.room.name != creep.memory.workRoom) {
			utils.DefaultMoveTo(creep, new RoomPosition(25, 25, creep.memory.workRoom));
		} else {
			var deposit = Game.getObjectById(creep.memory.targetId);
			if(!creep.pos.isNearTo(deposit)) {
				utils.DefaultMoveTo(creep, deposit);
			} else {
				if(creep.memory.remTime == undefined) {
					creep.memory.remTime = 1500 - creep.ticksToLive + 70;
				}
				creep.memory.status = 'work';
			}
		}
		break;
	}
	case 'work': {
		if(creep.store.getFreeCapacity(RESOURCE_MIST) < mistWorkParts ||
			(creep.memory.remTime != undefined && creep.ticksToLive < creep.memory.remTime)) {
			creep.memory.status = 'back';
			break;
		}
		var deposit = Game.getObjectById(creep.memory.targetId);
		var err = creep.harvest(deposit);
		// try to sleep
		if(err != 0 && creep.ticksToLive - deposit.cooldown > creep.memory.remTime) {
			var sleepTime = Math.max(deposit.cooldown - 3, 0);
			if(sleepTime > 0) {
				creep.memory.sleepTo = Game.time + sleepTime;
				creep.memory.status = 'sleep';
			}
		}
		break;
	}
	case 'sleep': {
		creep.say('💤');
		if(Game.time >= creep.memory.sleepTo) {
			creep.memory.status = 'work';
		}
		break;
	}
	case 'back': {
		if(creep.store.getUsedCapacity(RESOURCE_MIST) == 0) {
			if(creep.ticksToLive >= creep.memory.remTime) {
				creep.memory.status = 'toWork';
			} else {
				creep.suicide();
			}
			break;
		}
		var terminal = Game.rooms[creep.memory.ctrlRoom].terminal;
		if(creep.room.name != terminal.room.name) {
			utils.DefaultMoveTo(creep, terminal);
			break;
		}
		var err = creep.transfer(terminal, RESOURCE_MIST);
		if(err == ERR_NOT_IN_RANGE) {
			utils.DefaultMoveTo(creep, terminal);
			break;
		}
		if(err == 0) {
			if(Memory.mist == undefined) {
				Memory.mist = 0;
			}
			Memory.mist += creep.store[RESOURCE_MIST];
		}
		break;
	}
	}
}

module.exports = {
    Run,
    GetPartsAndCost,
};
