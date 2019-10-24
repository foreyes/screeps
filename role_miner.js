var utils = require('utils');

function Run(ctx, creep) {
	var source = ctx.sources[creep.memory.sourceIdx];
	var target = Game.getObjectById(source.memory.containerId);

	source.memory.minerId = creep.id;

	if(!utils.IsSamePosition(creep.pos, target.pos)) {
		utils.DefaultMoveTo(creep, target);
		return;
	}
	creep.harvest(source);
}

module.exports = {
    Run
};