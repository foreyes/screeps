var TerminalConfig = {
	'E33N36': {
		need: {
			[RESOURCE_ENERGY]: 40000,
			[RESOURCE_KEANIUM]: 2000,
			[RESOURCE_KEANIUM_BAR]: 400,
			[RESOURCE_MIST]: 2000,
		},
	},
	'E35N38': {
		need: {
			[RESOURCE_ENERGY]: 40000,
			[RESOURCE_CATALYST]: 100000,
		},
	},
	'E29N34': {
		need: {
			[RESOURCE_ENERGY]: 150000,
		},
		priority: {
			[RESOURCE_ENERGY]: 2,
		},
	},
	'E29N33': {
		need: {
			[RESOURCE_ENERGY]: 40000,
		},
	},
};

module.exports = TerminalConfig;