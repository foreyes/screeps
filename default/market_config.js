var marketBuyConfig = {
    [RESOURCE_ZYNTHIUM_BAR]: {
        roomName: 'E33N36',
        amount: 10000,
        price: 0.4,
        least: 2000,
    },
    [RESOURCE_KEANIUM_BAR]: {
        roomName: 'E29N33',
        amount: 30000,
        price: 0.4,
        least: 3000,
    },
    [RESOURCE_UTRIUM_BAR]: {
        roomName: 'E29N34',
        amount: 10000,
        price: 0.4,
        least: 1000,
    },
    [RESOURCE_LEMERGIUM_BAR]: {
        roomName: 'E33N36',
        amount: 10000,
        price: 0.7,
        least: 2000,
    },
    [RESOURCE_REDUCTANT]: {
        roomName: 'E26N31',
        amount: 30000,
        price: 0.4,
        least: 3000,
    },
    [RESOURCE_OPS]: {
        roomName: 'E33N36',
        amount: 30000,
        price: 0.61,
        least: 1000,
    },
    [RESOURCE_POWER]: {
        roomName: 'E29N33',
        amount: 100000,
        price: 2.3,
        least: 1000,
    },
    [RESOURCE_GHODIUM_MELT]: {
        roomName: 'E33N36',
        amount: 20000,
        price: 3.6,
        least: 20000,
    },
    [RESOURCE_CRYSTAL]: {
        roomName: 'E33N36',
        amount: 100000,
        price: 5.5,
        least: 1000,
    },
    [RESOURCE_CONCENTRATE]: {
        roomName: 'E33N36',
        amount: 272,
        price: 120,
        least: 136,
    },
    [RESOURCE_EXTRACT]: {
        roomName: 'E35N38',
        amount: 42,
        price: 1550,
        least: 21,
    },
    [RESOURCE_MICROCHIP]: {
        roomName: 'E33N36',
        amount: 60,
        price: 10000,
        least: 30,
    },
    [RESOURCE_SPIRIT]: {
        roomName: 'E33N36',
        amount: 90,
        price: 5000,
        least: 15,
    },
    [RESOURCE_CIRCUIT]: {
        roomName: 'E33N36',
        amount: 20,
        price: 33000,
        least: 10,
    },
    [RESOURCE_EMANATION]: {
        roomName: 'E33N36',
        amount: 30,
        price: 15000,
        least: 5,
    },
};

var marketSellConfig = {
    [RESOURCE_OXIDANT]: {
        roomName: 'E26N31',
        price: 0.22,
        least: 10000,
    },
    [RESOURCE_SPIRIT]: {
        roomName: 'E35N38',
        price: 6500,
        least: 0,
    },
    [RESOURCE_CRYSTAL]: {
        roomName: 'E33N36',
        price: 6.5,
        least: 30000,
    },
    [RESOURCE_COMPOSITE]: {
        roomName: 'E29N34',
        price: 3.5,
        least: 0,
    },
    [RESOURCE_ESSENCE]: {
        roomName: 'E33N36',
        price: 50000,
        least: 0,
    },
    [RESOURCE_DEVICE]: {
        roomName: 'E33N36',
        price: 75000,
        least: 0,
    }
};

var rushBuyConfig = {
    [RESOURCE_MIST]: {
        roomName: 'E29N33',
        amount: 20000,
        price: 2.3,
        maxPrice: 3.39,
        once: 5000,
    },
    // [RESOURCE_CONDENSATE]: {
    //     roomName: 'E26N31',
    //     amount: 20000,
    //     price: 6.3,
    //     maxPrice: 25,
    //     once: 6000,
    // },
}

module.exports = {
    marketBuyConfig,
    marketSellConfig,
    rushBuyConfig,
};
