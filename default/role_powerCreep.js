const PowerCreepConfig = {
	'The Jack': 'E29N34',
	'The Queen': 'E33N36',
	'The King': 'E35N38',
	'The Joker': 'E26N31',
	'The World': 'E29N33',
};

function enablePower(ctx, powerCreep) {
	if(ctx.room.controller.isPowerEnabled) return false;
	if(!powerCreep.pos.isNearTo(ctx.room.controller)) {
		powerCreep.moveTo(ctx.room.controller);
		return true;
	}
	powerCreep.enableRoom(ctx.room.controller);
	return false;
}

function maintainFactory(ctx, powerCreep) {
	if(!ctx.factory || !powerCreep.powers[PWR_OPERATE_FACTORY]) return false;
	if(ctx.factory.effects != undefined && ctx.factory.effects.length > 0) return false;
	if(ctx.factory.level && ctx.factory.level != powerCreep.powers[PWR_OPERATE_FACTORY].level) return false;
	if(powerCreep.store[RESOURCE_OPS] >= 100) {
		if(!powerCreep.pos.inRangeTo(ctx.factory, 3)) {
			powerCreep.moveTo(ctx.factory);
			return true;
		}
		var err = powerCreep.usePower(PWR_OPERATE_FACTORY, ctx.factory);
		return err == 0;
	}
	if(!ctx.terminal || ctx.terminal.store[RESOURCE_OPS] < 100) return false;
	if(!powerCreep.pos.isNearTo(ctx.terminal)) {
		powerCreep.moveTo(ctx.terminal);
		return true;
	}
	var err = powerCreep.withdraw(ctx.terminal, RESOURCE_OPS, 100);
	return err == 0;
}

function operateExtension(ctx, powerCreep) {
	if(!ctx.terminal) return false;
	if(!powerCreep.powers[PWR_OPERATE_EXTENSION] ||
		powerCreep.powers[PWR_OPERATE_EXTENSION].cooldown > 0) return false;
	// about 3000 energy
	if(ctx.emptyExts.length < 12) return false;
	if(!powerCreep.pos.inRangeTo(ctx.terminal, 3)) {
		powerCreep.moveTo(ctx.terminal);
		return true;
	}
	if(powerCreep.store[RESOURCE_OPS] < 2 && ctx.terminal.store[RESOURCE_OPS] >= 20) {
		if(!powerCreep.pos.isNearTo(ctx.terminal)) {
			powerCreep.moveTo(ctx.terminal);
			return true;
		} else {
			powerCreep.withdraw(ctx.terminal, RESOURCE_OPS, 20);
			return true;
		}
	}
	var err = powerCreep.usePower(PWR_OPERATE_EXTENSION, ctx.terminal);
	return err == 0;
}

function operateLabs(ctx, powerCreep) {
	if(!ctx.terminal || !ctx.reactionLabs) return false;
	if(!powerCreep.powers[PWR_OPERATE_LAB] ||
		powerCreep.powers[PWR_OPERATE_LAB].cooldown > 0) return false;
	for(var i in ctx.reactionLabs) {
		var lab = ctx.reactionLabs[i];
		if(lab.effects != undefined && lab.effects.length > 0) continue;
		if(powerCreep.store[RESOURCE_OPS] < 10) {
			if(ctx.terminal.store[RESOURCE_OPS] == 0) return false;
			if(!powerCreep.pos.isNearTo(ctx.terminal)) {
				powerCreep.moveTo(ctx.terminal);
				return true;
			}
			var err = powerCreep.withdraw(ctx.terminal, RESOURCE_OPS, Math.min(ctx.terminal.store[RESOURCE_OPS], 100));
			return err == 0;
		} else {
			if(!powerCreep.pos.inRangeTo(lab, 3)) {
				powerCreep.moveTo(lab);
				return true;
			}
			var err = powerCreep.usePower(PWR_OPERATE_LAB, lab);
			return err == 0;
		}
	}
	return false;
}

function storeOps(ctx, powerCreep) {
	if(!ctx.terminal) return false;
	if(powerCreep.store[RESOURCE_OPS] < 210) return false;
	var retAmount = Math.max(powerCreep.store[RESOURCE_OPS] - 110, 0);
	if(retAmount == 0) return false;
	if(!powerCreep.pos.isNearTo(ctx.terminal)) {
		powerCreep.moveTo(ctx.terminal);
		return true;
	}
	var err = powerCreep.transfer(ctx.terminal, RESOURCE_OPS, retAmount);
	return err == 0;
}

function regenSource(ctx, powerCreep) {
	if(!powerCreep.powers[PWR_REGEN_SOURCE] ||
		powerCreep.powers[PWR_REGEN_SOURCE].cooldown > 0) return false;
	for(var src of ctx.sources) {
		if(src.effects != undefined && src.effects.length > 0) {
			continue;
		}
		if(!powerCreep.pos.inRangeTo(src, 3)) {
			powerCreep.moveTo(src);
			return true;
		}
		var err = powerCreep.usePower(PWR_REGEN_SOURCE, src);
		return err == 0;
	}
	return false;
}

function Run(powerCreep) {
	var roomName = PowerCreepConfig[powerCreep.name];
	var ctx = Game.rooms[roomName].ctx;
	if(powerCreep.hits != undefined) {
		if(powerCreep.powers[PWR_GENERATE_OPS] &&
			powerCreep.powers[PWR_GENERATE_OPS].cooldown == 0) {
			powerCreep.usePower(PWR_GENERATE_OPS);
		}

		if(powerCreep.ticksToLive < 1000) {
			if(!powerCreep.pos.isNearTo(ctx.powerSpawn)) {
				powerCreep.moveTo(ctx.powerSpawn);
				break;
			}
			powerCreep.renew(ctx.powerSpawn);
			break;
		}

		if(enablePower(ctx, powerCreep)) break;
		if(maintainFactory(ctx, powerCreep)) break;
		if(operateExtension(ctx, powerCreep)) break;
		if(operateLabs(ctx, powerCreep)) break;
		if(storeOps(ctx, powerCreep)) break;
		if(regenSource(ctx, powerCreep)) break;
		// rest
		if(!powerCreep.pos.isNearTo(ctx.powerSpawn)){
			powerCreep.moveTo(ctx.powerSpawn);
		}
	} else if(powerCreep.spawnCooldownTime == undefined) {
		powerCreep.spawn(ctx.powerSpawn);
	}
}

module.exports = {
	Run,
};