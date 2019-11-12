var utils = require('utils');

function CreateMister(spawnId = '5dc6d24401ce096f94fc8ea6') {
	return Game.getObjectById(spawnId).spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'm1', {memory: {role: 'mister'}});
}

var flags = ['flag1', 'flag2', 'flag3'];

function Run(ctx, creep) {
	if(creep.memory.flagS) {
		creep.suicide();
		return;
	}
	if(!creep.memory.flagStage) {
		creep.memory.flagStage = 0;
	}
	if(!creep.memory.flag1 && creep.memory.flagStage != flags.length) {
		var flag = Game.flags[flags[creep.memory.flagStage]];
		if(utils.IsSamePosition(creep.pos, flag.pos)) {
			creep.memory.flagStage += 1;
			return;
		} else {
			creep.moveTo(flag, {reusePath: 100, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}});
			return;
		}
	}

	if(!creep.memory.flag1) {
		if(creep.memory.remTime == undefined){
			creep.memory.remTime = 1500 - creep.ticksToLive + 150;
		}
		var targets = creep.room.lookAt(Game.flags.flagMist.pos).filter((item) => item.type == 'deposit');
		if(targets.length == 0) return;
		creep.memory.targetId = targets[0].deposit.id;

		delete creep.memory._move;
		creep.memory.flag1 = true;
		creep.memory.flagStage = flags.length - 2;
	}

	if(creep.ticksToLive > creep.memory.remTime && creep.store.getFreeCapacity(RESOURCE_MIST) > 0) {
		var target = Game.getObjectById(creep.memory.targetId);
		if(!target) {
			creep.memory.remTime = creep.ticksToLive;
			return;
		}
		var err = creep.harvest(target);
		return;
	}
	if(creep.memory.flagStage != -1) {
		var flag = Game.flags[flags[creep.memory.flagStage]];
		if(utils.IsSamePosition(creep.pos, flag.pos)) {
			creep.memory.flagStage -= 1;
			return;
		} else {
			creep.moveTo(flag, {reusePath: 100, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}});
			return;
		}
	}

	var err = creep.transfer(Game.rooms['E33N36'].storage, RESOURCE_MIST);
	if(err == ERR_NOT_IN_RANGE) {
		creep.moveTo(Game.rooms['E33N36'].storage, {reusePath: 100, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffaa00'}})
	} else if(err == 0) {
		if(creep.ticksToLive < creep.memory.remTime) {
			creep.memory.flagS = true;
		} else {
			creep.memory = {role: 'mister', remTime: creep.memory.remTime};
		}
	}
}

module.exports = {
    Run,
    CreateMister
};
