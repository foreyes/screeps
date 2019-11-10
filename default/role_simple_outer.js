var utils = require('utils');

function Run(ctx, creep) {
	var flagName = creep.memory.flagName;
	ctx.room.memory.tmp[flagName] = creep.id;

	if(creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		var pos1 = creep.pos, pos2 = Game.flags[creep.memory.flagName].pos;
		if(pos1.roomName != pos2.roomName || utils.GetDirectDistance(pos1, pos2) > 1) {
			utils.DefaultMoveTo(creep, pos2);
			return;
		}
		creep.say('hi');
		var target = creep.room.lookAt(pos2).filter(
			(item) => {
				return item.type == 'source';
			}
		);
		target = target[0].source;
		creep.harvest(target);
		return;
	} else {
		var target = ctx.room.storage;
		if(creep.transfer(target, RESOURCE_ENERGY)) {
			utils.DefaultMoveTo(creep, target);
			return;
		} else {
			if(ctx.room.memory.tmp.cnt == undefined) {
				ctx.room.memory.tmp.cnt = 0;
			}
			ctx.room.memory.tmp.cnt += 750;
		}
	}
}

module.exports = {
    Run
};