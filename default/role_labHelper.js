var utils = require('utils');

var helperParts = utils.GetPartsByArray([[CARRY, 20], [MOVE, 10]]);

function GetPartsAndCost(energy) {
	if(energy < 1500) {
		return {cost: 0, parts: []};
	}
	return {cost: 1500, parts: helperParts};
}

function runClear(ctx, creep) {
	if(!creep.memory.state) {
		creep.memory.state = 'withdraw';
	}

	switch(creep.memory.state) {
	case 'withdraw': {
		if(creep.store.getFreeCapacity() == 0) {
			creep.memory.state = 'transfer';
			break;
		}
		for(var i in ctx.labs) {
			var lab = ctx.labs[i];
			for(var resourceType in lab.store) {
				if(lab.store[resourceType] > 0) {
					if(!creep.pos.isNearTo(lab)) {
						utils.DefaultMoveTo(creep, lab);
						return;
					}
					creep.withdraw(lab, resourceType);
					return;
				}
			}
		}
		if(creep.store.getUsedCapacity() != 0) {
			creep.memory.state = 'transfer';
		} else {
			creep.memory.state = 'finishClear';
		}
		break;
	}
	case 'transfer': {
		if(!creep.pos.isNearTo(ctx.terminal)) {
			utils.DefaultMoveTo(creep, ctx.terminal);
			return;
		}
		for(var resourceType in creep.store) {
			if(creep.store[resourceType] > 0) {
				creep.transfer(ctx.terminal, resourceType);
				return;
			}
		}
		creep.memory.state = 'withdraw';
		break;
	}
	case 'idle': {
		creep.memory.state = 'withdraw';
		break;
	}
	}
}

function getCentralLabs(ctx) {
	if(ctx.room.memory.centralLabIds) {
		return ctx.centralLabs = ctx.room.memory.centralLabIds.map(Game.getObjectById);
	}
	var maxx = -1, maxy = -1, minx = 1000, miny = 1000;
	for(var i in ctx.labs) {
		var pos = ctx.labs[i].pos;
		maxx = Math.max(maxx, pos.x);
		maxy = Math.max(maxy, pos.y);
		minx = Math.min(minx, pos.x);
		miny = Math.min(miny, pos.y);
	}
	console.log(maxx, minx, maxy, miny);
	ctx.centralLabs = ctx.labs.filter((lab) => {
		return lab.pos.x != maxx && lab.pos.x != minx && lab.pos.y != maxy && lab.pos.y != miny;
	});
	ctx.room.memory.centralLabIds = ctx.centralLabs.map((obj) => obj.id);
	return ctx.centralLabs;
}

function getReactionLabs(ctx) {
	ctx.reactionLabs = [];
	for(var i in ctx.labs) {
		var flag = true;
		for(var j in ctx.centralLabs) {
			if(ctx.labs[i].id == ctx.centralLabs[j].id) flag = false;
		}
		if(flag) {
			ctx.reactionLabs.push(ctx.labs[i]);
		}
	}
	return ctx.reactionLabs;
}

function runReaction(ctx, creep) {
	if(!ctx.room.memory.labRaws) return;
	var labRaws = ctx.room.memory.labRaws;

	if(!creep.memory.state || creep.memory.state == 'finishClear') {
		creep.memory.state = 'lookAround';
	}

	var centralLabs = getCentralLabs(ctx);
	var reactionLabs = getReactionLabs(ctx);

	switch(creep.memory.state) {
	case 'lookAround': {
		if(creep.ticksToLive < 50) {
			creep.suicide();
			return;
		}
		for(var i in centralLabs) {
			var lab = centralLabs[i], resourceType = labRaws[i];
			if(lab.store[resourceType] < 1000) {
				creep.memory.labIdx = i;
				creep.memory.state = 'withdrawRaw';
				return;
			}
		}
		for(var i in reactionLabs) {
			var lab = reactionLabs[i], resourceType = reactionLabs[i].mineralType;
			if(!resourceType) continue;
			if(lab.store[resourceType] >= 1000) {
				creep.memory.labIdx = i;
				creep.memory.state = 'withdrawProduct';
				return;
			}
		}
		break;
	}
	case 'withdrawRaw': {
		var labIdx = creep.memory.labIdx;
		var resourceType = labRaws[labIdx];
		creep.say(resourceType);
		if(creep.store[resourceType] > 0) {
			creep.memory.state = 'transferRaw';
			break;
		}
		if(ctx.terminal.store[resourceType] == 0) {
			creep.memory.state = 'idle';
			break;
		}
		if(!creep.pos.isNearTo(ctx.terminal)) {
			utils.DefaultMoveTo(creep, ctx.terminal);
			return;
		}
		creep.withdraw(ctx.terminal, resourceType);
		break;
	}
	case 'withdrawProduct': {
		var labIdx = creep.memory.labIdx;
		var lab = reactionLabs[labIdx];
		var resourceType = lab.mineralType;
		if(creep.store.getFreeCapacity(resourceType) == 0 || lab.store[resourceType] == 0) {
			creep.memory.state = 'transferProduct';
			break;
		}
		if(!creep.pos.isNearTo(lab)) {
			utils.DefaultMoveTo(creep, lab);
			return;
		}
		creep.withdraw(lab, resourceType);
		break;

	}
	case 'transferRaw': {
		var labIdx = creep.memory.labIdx;
		var lab = centralLabs[labIdx], resourceType = labRaws[labIdx];
		if(creep.store[resourceType] == 0) {
			creep.memory.state = 'lookAround';
			break;
		}
		if(!creep.pos.isNearTo(lab)) {
			utils.DefaultMoveTo(creep, lab);
			return;
		}
		creep.transfer(lab, resourceType);
		break;
	}
	case 'transferProduct': {
		if(creep.store.getUsedCapacity() == 0) {
			creep.memory.state = 'lookAround';
			break;
		}
		if(!creep.pos.isNearTo(ctx.terminal)) {
			utils.DefaultMoveTo(creep, ctx.terminal);
			return;
		}
		for(var resourceType in creep.store) {
			if(creep.store[resourceType] > 0) {
				creep.transfer(ctx.terminal, resourceType);
				return;
			}
		}
		break;
	}
	}
}

function Run(ctx, creep) {
	if(!ctx.terminal) return;

	switch(ctx.room.memory.labState) {
	case 'clear': {
		return runClear(ctx, creep);
	}
	case 'reaction': {
		return runReaction(ctx, creep);
	}
	}
}

module.exports = {
	GetPartsAndCost,
	Run
};