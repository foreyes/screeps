function try2Respawn(powerCreep) {
	if(powerCreep.spawnCooldownTime == 0) {
		powerCreep.spawn(ctx.powerSpawn);
	}
}

function check2EnableFactory(ctx, powerCreep) {
	var canUsePower = powerCreep.powers[PWR_OPERATE_FACTORY] &&
						powerCreep.powers[PWR_OPERATE_FACTORY].cooldown == 0;
	if(!canUsePower) return false;
	var unActive = ctx.factory && (ctx.factory.level == undefined || !ctx.factory.isActive());
	if(!unActive) return false;
	var enoughResource = ctx.factory.store[RESOURCE_UTRIUM_BAR] >= 400 &&
							ctx.factory.store[RESOURCE_ZYNTHIUM_BAR] >= 400;
	if(!enoughResource) return false;
	var enoughOps = ctx.terminal.store[RESOURCE_OPS] + powerCreep.store[RESOURCE_OPS] >= 100;
	if(!enoughOps) return false;
	return true;
}

function Run(powerCreep) {
	if(powerCreep.spawnCooldownTime != undefined) {
		return try2Respawn(powerCreep);
	}

	if(powerCreep.name == 'The Queen') {
		var ctx = Game.rooms['E33N36'].ctx;
		if(powerCreep.ticksToLive < 50) {
			if(powerCreep.)
		}suicide()

		if(check2EnableFactory(ctx, powerCreep)) {
			if(powerCreep.store[RESOURCE_OPS] < 100) {
				return powerCreep.myWithdraw(ctx.terminal, RESOURCE_OPS);
			}
			var err = powerCreep.usePower(PWR_OPERATE_FACTORY, ctx.factory);
			if(err == ERR_NOT_IN_RANGE) {
				powerCreep.moveTo(ctx.factory);
				return 0;
			}
			return 0;
		}

		if()
	}	
}

module.exports = {
	Run,
};