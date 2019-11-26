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
			}
		},
	},
	'E35N38': {
		outSources: {
			'E35N37': {
				needReserve: true,
				needClearInvader: false,
				controller: '5bbcaef99099fc012e639e6d',
				reservePos: {x: 18, y: 20, roomName: 'E35N37'},
				sources: ['5bbcaef99099fc012e639e6c'],
				workPos: [{x: 41, y: 6, roomName: 'E35N37'}],
			}
		},
	}
};

module.exports = RoomConfig;