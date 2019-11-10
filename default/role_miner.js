var utils = require('utils');

function Run(ctx, creep) {
	var source = ctx.sources[creep.memory.sourceIdx];
	if(!ctx.sourceContainers || !ctx.sourceContainers[creep.memory.sourceIdx]) {
		var err = creep.harvest(source);
		if(err != 0) {
			utils.DefaultMoveTo(creep, source);
		}
		return;
	}

	var target = ctx.sourceContainers[creep.memory.sourceIdx];
	if(!utils.IsSamePosition(creep.pos, target.pos)) {
		utils.DefaultMoveTo(creep, target);
		return;
	}
	creep.harvest(source);
}

module.exports = {
    Run
};