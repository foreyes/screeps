var FactoryConfig = {
	'E33N36': {
		need: {
			[RESOURCE_ENERGY]: 10000,
			[RESOURCE_KEANIUM]: 1000,
			[RESOURCE_KEANIUM_BAR]: 1000,
			[RESOURCE_ZYNTHIUM]: 1000,
			[RESOURCE_MIST]: 1000,
		},
		produceList: [RESOURCE_CONDENSATE, RESOURCE_KEANIUM_BAR, RESOURCE_ZYNTHIUM_BAR],
	},
	'E35N38': {
		need: {
			[RESOURCE_ENERGY]: 10000,
			[RESOURCE_CATALYST]: 1000,
			[RESOURCE_KEANIUM]: 1000,
		},
		produceList: [RESOURCE_PURIFIER, RESOURCE_KEANIUM_BAR],
	},
	'E29N34': {
		need: {
			[RESOURCE_ENERGY]: 10000,
			[RESOURCE_OXYGEN]: 1000,
		},
		produceList: [RESOURCE_OXIDANT],
	},
};

module.exports = FactoryConfig;