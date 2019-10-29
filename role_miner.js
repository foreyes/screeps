var utils = require('utils');

function Run(ctx, creep) {
	var source = ctx.sources[creep.memory.sourceIdx];
	var target = ctx.sourceContainers[creep.memory.sourceIdx];

	if(ctx.room.memory.ctx.minerId4Source == undefined) {
		ctx.room.memory.ctx.minerId4Source = [null, null];
	}
	ctx.room.memory.ctx.minerId4Source[creep.memory.sourceIdx] = creep.id;

	if(!utils.IsSamePosition(creep.pos, target.pos)) {
		utils.DefaultMoveTo(creep, target);
		return;
	}
	creep.harvest(source);
}

module.exports = {
    Run
};