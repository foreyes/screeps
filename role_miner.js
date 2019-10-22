var utils = require('utils');

function Run(ctx, creep) {
	var minerId = creep.memory.minerId;
	var source = ctx.sources[minerId];
	var target = source.memory.container;
	if(!utils.IsSamePosition(creep.pos, target.pos)) {
		utils.DefaultMoveTo(creep, target);
		return;
	}
	creep.harvest(source);
}

module.exports = {
    Run
};