var TerminalConfig = {
	'E33N36': {
		need: {
			[RESOURCE_ENERGY]: 40000,
			[RESOURCE_KEANIUM]: 5000,
			[RESOURCE_KEANIUM_BAR]: 1000,
			[RESOURCE_PURIFIER]: 1000,
			[RESOURCE_LEMERGIUM]: 5000,
			[RESOURCE_LEMERGIUM_BAR]: 1000,
			[RESOURCE_OPS]: 1000,
			[RESOURCE_OXIDANT]: 1000,
			[RESOURCE_CONDENSATE]: 1000,
			[RESOURCE_CONCENTRATE]: 1000,
		},
		priority: {
			[RESOURCE_CONDENSATE]: 1000,
		},
	},
	'E35N38': {
		need: {
			[RESOURCE_ENERGY]: 150000,
			[RESOURCE_CATALYST]: 100000,
			[RESOURCE_MIST]: 10000,
			[RESOURCE_ZYNTHIUM]: 10000,
		},
		priority: {
			[RESOURCE_ENERGY]: 3,
		},
	},
	'E29N34': {
		need: {
			[RESOURCE_ENERGY]: 40000,
			[RESOURCE_HYDROGEN]: 5000,
			[RESOURCE_CONDENSATE]: 100,
			[RESOURCE_KEANIUM_BAR]: 100,
			[RESOURCE_REDUCTANT]: 100,
			[RESOURCE_ZYNTHIUM_BAR]: 100,
			[RESOURCE_OPS]: 1000,
			[RESOURCE_UTRIUM]: 5000,
			[RESOURCE_UTRIUM_BAR]: 1000,
		},
	},
	'E29N33': {
		need: {
			[RESOURCE_ENERGY]: 40000,
		},
	},
};

module.exports = TerminalConfig;