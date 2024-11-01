const RustPlus = require('@liamcottle/rustplus.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const rustplus = new RustPlus('104.234.180.19', '24071', '76561199087358895', '-1617190158');

rustplus.connect();

function calculateImageXY(coords, width, height, oceanMargin, mapSize) {
    const x = coords.x * ((width - 2 * oceanMargin) / mapSize) + oceanMargin;
    const n = height - 2 * oceanMargin;
    const y = height - (coords.y * (n / mapSize) + oceanMargin);
    return { x: x, y: y };
}

rustplus.on('connecting', () => console.log('Connecting to RustPlus server...'));
rustplus.on('connected', async () => {
    console.log('Connected to RustPlus server');

    setInterval(async () => {
        try {
            const teamInfoResponse = await rustplus.sendRequestAsync({ getTeamInfo: {} }, 20000);
            const teamMembers = teamInfoResponse.teamInfo.members;
            const playerCoordinates = [];
            //console.log(teamInfoResponse.teamInfo.members)
            teamMembers.forEach(member => {
                if (!member.isAlive && member.isOnline) {
                    rustplus.sendTeamMessage(`Name: ${member.name} - Dead`);
                }
                if (member.isOnline) {
                    playerCoordinates.push({
                        name: member.name,
                        coordinates: {
                            x: member.x,
                            y: member.y
                        },
                        isAlive: member.isAlive
                    });
                }
                console.log(`Player: ${member.name} - Status: ${member.isAlive ? 'Alive' : 'Dead'}`);
            });

            // Storage Monitor stuff
            const entityResponse = await rustplus.sendRequestAsync({ entityId: 5881931 , getEntityInfo: {} }, 20000);
            console.log(entityResponse.entityInfo.payload.items);

            /*
            itemId , -2099697608 = stone
            itemId , -151838493 = wood
            itemId , 69511070 = metal
            itemId , 317398316 = HQM
            itemId , -858312878 = Cloth
            itemId , -932201673 = Scrap
            */

            // TC Upkeep Time
            tc_upkeep_time = entityResponse.entityInfo.payload.protectionExpiry;
            // console.log(tc_upkeep_time)
            tc_upkeep_time = new Date(tc_upkeep_time * 1000);

            const gmtPlus8Time = new Date(tc_upkeep_time.getTime() + 8 * 60 * 60 * 1000);
            const gmtPlus8String = gmtPlus8Time.toUTCString();
            console.log(`TC Upkeep Time: ${gmtPlus8String}`);
            
            // Map Stuff

            const serverInfoResponse = await rustplus.sendRequestAsync({ getInfo: {} }, 20000);
            const mapResponse = await rustplus.sendRequestAsync({ getMap: {} }, 20000);

            const width = mapResponse.map.width;
            const height = mapResponse.map.height;
            const oceanMargin = mapResponse.map.oceanMargin;
            const mapSize = serverInfoResponse.info.mapSize;

            fs.writeFileSync('map.jpg', mapResponse.map.jpgImage);
            console.log('Map retrieved and saved as map.jpg');

            // Load map image and draw player coordinates
            const image = await loadImage('map.jpg');
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);
            
            console.log(playerCoordinates);
            playerCoordinates.forEach(player => {
                const parsedCoordinates = calculateImageXY(player.coordinates, width, height, oceanMargin, mapSize);
                ctx.fillStyle = player.isAlive ? 'green' : 'red';
                ctx.beginPath();
                ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '32px Consolas';
                ctx.fillStyle = 'purple';
                ctx.fillText(player.name, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
            });

            const GameMonuments = mapResponse.map.monuments;
            GameMonuments.forEach(monument => {
                const parsedCoordinates = calculateImageXY(monument, width, height, oceanMargin, mapSize);
                ctx.fillStyle = 'blue';
                ctx.beginPath();
                ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '24px Consolas';
                ctx.fillStyle = 'black';
                const formattedToken = monument.token.replace(/_|display_name/g, " ");
                ctx.fillText(formattedToken, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
            });

            // Save the updated image with player coordinates
            const buffer = canvas.toBuffer('image/jpeg');
            fs.writeFileSync('map_with_players.jpg', buffer);
            console.log('Map with player coordinates saved as map_with_players.jpg');

        } catch (error) {
            console.error('Error retrieving data:', error);
        }
    }, 2000);
});

rustplus.on('disconnected', () => console.log('Disconnected from RustPlus server'));
rustplus.on('error', (error) => console.error('WebSocket error:', error));
