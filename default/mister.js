var utils = require('utils');

function GetPartsAndCost(energy) {
	if(energy < 3300) {
		return {cost: 0, parts: []};
	} else {
		return {cost: 3300, parts: utils.GetPartsByArray([[WORK, 16], [CARRY, 9], [MOVE, 25]])};
	}
}

function Run(ctx, creep) {
	switch(creep.memory.status) {
	case 'toWork': {
		if(creep.room.name != creep.memory.workRoom) {
			utils.DefaultMoveTo(creep, new RoomPosition(25, 25, creep.memory.workRoom));
		} else {
			creep.memory.status = 'work';
		}
		break;
	}
	case 'work': {
		if(creep.store.getFreeCapacity(RESOURCE_MIST) < 16 ||
			(creep.memory.remTime != undefined && creep.ticksToLive < creep.memory.remTime)) {
			creep.memory.status = 'back';
			break;
		}
		var deposit = Game.getObjectById(creep.memory.targetId);
		var err = creep.harvest(deposit);
		if(err == ERR_NOT_IN_RANGE) {
			utils.DefaultMoveTo(creep, deposit);
		} else {
			if(creep.memory.remTime == undefined) {
				creep.memory.remTime = 1500 - creep.ticksToLive + 150;
			}
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
		break;
	}
	}
}

module.exports = {
    Run,
    GetPartsAndCost,
};
