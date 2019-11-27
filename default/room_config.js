// 7级之前每个基地最多三个外矿点（三个miner）
var RoomConfig = {
	'E29N34': {
		// TODO: maintain room infomations here
		// *********************************
		// sources: [],
		// sourceContainers: [],
		// centralContainers: [],
		// controllerContainer: ,
		// sourceLinks: [],
		// centralLink: ,
		// mainSpawn: ,
		// spawns: [],
		// **********************************
		// out sources
		outSources: {
			'E29N35': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaea19099fc012e639585',
				reservePos: {x: 38, y: 45, roomName: 'E29N35'},
				sources: ['5bbcaea19099fc012e639584'],
				workPos: [{x: 6, y: 4, roomName: 'E29N35'}],
			},
		},
	},
	'E33N36': {
		outSources: {
			'E33N37': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaedb9099fc012e639a82',
				reservePos: {x: 19, y: 25, roomName: 'E33N37'},
				sources: ['5bbcaedb9099fc012e639a83', '5bbcaedb9099fc012e639a81'],
				workPos: [{x: 4, y: 39, roomName: 'E33N37'}, {x: 37, y: 5, roomName: 'E33N37'}],
			},
			'E33N35': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaedb9099fc012e639a8a',
				reservePos: {x: 34, y: 17, roomName: 'E33N35'},
				sources: ['5bbcaedb9099fc012e639a89'],
				workPos: [{x: 15, y: 10, roomName: 'E33N35'}],
			},
		},
	},
	'E35N38': {
		outSources: {
			'E35N37': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaef99099fc012e639e6d',
				reservePos: {x: 18, y: 20, roomName: 'E35N37'},
				sources: ['5bbcaef99099fc012e639e6c', '5bbcaef99099fc012e639e6e'],
				workPos: [{x: 41, y: 6, roomName: 'E35N37'}, {x: 19, y: 41, roomName: 'E35N37'}],
			},
			'E36N38': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaf0b9099fc012e63a095',
				reservePos: {x: 12, y: 43, roomName: 'E36N38'},
				sources: ['5bbcaf0b9099fc012e63a094'],
				workPos: [{x: 33, y: 40, roomName: 'E36N38'}],
			},
		},
	},
	'E29N33': {
		outSources: {
			'E29N32': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaea29099fc012e63958f',
				reservePos: {x: 11, y: 10, roomName: 'E29N32'},
				sources: ['5bbcaea29099fc012e639590', '5bbcaea29099fc012e639591'],
				workPos: [{x: 36, y: 37, roomName: 'E29N32'}, {x: 39, y: 42, roomName: 'E29N32'}],
			},
			'E28N33': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcae939099fc012e639400',
				reservePos: {x: 24, y: 10, roomName: 'E28N33'},
				sources: ['5bbcae939099fc012e639401'],
				workPos: [{x: 33, y: 23, roomName: 'E28N33'}],
			},
		},
	},
};

module.exports = RoomConfig;