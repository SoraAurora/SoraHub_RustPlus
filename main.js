const RustPlus = require('@liamcottle/rustplus.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const rustplus = new RustPlus('104.234.180.19', '24071', '76561199087358895', '');
const webhookUrl_CP = ''; // webhooks here , multiple webhooks 
const webhookUrl_K9 = '';

const webhookurl_array = [webhookUrl_CP ,webhookUrl_K9 ];


rustplus.connect();

const gridDiameter = 146.25;

function sendDiscordWebhookMessage(webhookUrl, content) {
    const message = {
        content: content
    };
    
    // iterate over the array of webhook urls
    webhookurl_array.forEach(webhookUrl => {
        axios.post(webhookUrl, message)
            .then(response => {
                console.log("Message sent successfully!");
            })
            .catch(error => {
                console.error("Error sending message:", error);
            });
    });
    
}

function calculateImageXY(coords, width, height, oceanMargin, mapSize) {
    const x = coords.x * ((width - 2 * oceanMargin) / mapSize) + oceanMargin;
    const n = height - 2 * oceanMargin;
    const y = height - (coords.y * (n / mapSize) + oceanMargin);
    return { x: x, y: y };
}

function isOutsideGridSystem(x, y, mapSize, offset = 0) {
    return x < -offset || x > (mapSize + offset) || y < -offset || y > (mapSize + offset);
}

function isOutsideRowOrColumn(x, y, mapSize) {
    return (x < 0 && y > mapSize) || (x < 0 && y < 0) || (x > mapSize && y > mapSize) || (x > mapSize && y < 0);
}

function numberToLetters(num) {
    const mod = num % 26;
    let pow = Math.floor(num / 26);
    const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
    return pow ? numberToLetters(pow) + out : out;
}

function getGridPos(x, y, mapSize) {
    const correctedMapSize = getCorrectedMapSize(mapSize , gridDiameter);
    //console.log(mapSize , correctedMapSize);
    /* Outside the grid system */
    if (isOutsideGridSystem(x, y, correctedMapSize)) {
        console.log('Outside grid system');
        return null;
    }

    const gridPosLetters = getGridPosLettersX(x, correctedMapSize);
    //console.log(gridPosLetters);
    const gridPosNumber = getGridPosNumberY(y, correctedMapSize);
    //console.log(gridPosNumber);
    return gridPosLetters + gridPosNumber;
}

function getGridPosLettersX(x, mapSize) {
    let counter = 1;
    for (let startGrid = 0; startGrid < mapSize; startGrid += gridDiameter) {
        if (x >= startGrid && x <= (startGrid + gridDiameter)) {
            /* We're at the correct grid! */
            return numberToLetters(counter);
        }
        counter++;
    }
    console.log('No grid found');
    return null; // if no grid found
}

function getGridPosNumberY(y, mapSize) {
    let counter = 1;
    //console.log(mapSize , gridDiameter);
    const numberOfGrids = Math.floor(mapSize / gridDiameter);
    //console.log(numberOfGrids);
    for (let startGrid = 0; startGrid < mapSize; startGrid += gridDiameter) {
        if (y >= startGrid && y <= (startGrid + gridDiameter)) {
            /* We're at the correct grid! */
            return numberOfGrids - counter;
        }
        counter++;
    }
    console.log('No grid found');
    return null; //if no grid found
}

function getCorrectedMapSize(mapSize, gridDiameter) {
    //console.log(mapSize , gridDiameter);
    var remainder = mapSize % gridDiameter;
    //console.log(remainder);
    var offset = gridDiameter - remainder;
    //console.log(offset);
    return (remainder < 120) ? mapSize - remainder : mapSize + offset;
}

rustplus.on('connecting', () => console.log('Connecting to RustPlus server...'));
rustplus.on('connected', async () => {
    console.log('Connected to RustPlus server');
    const serverInfoResponse = await rustplus.sendRequestAsync({ getInfo: {} }, 20000);
    
    const mapResponse = await rustplus.sendRequestAsync({ getMap: {} }, 20000);

    const width = mapResponse.map.width;
    const height = mapResponse.map.height;
    const oceanMargin = mapResponse.map.oceanMargin;
    const mapSize = serverInfoResponse.info.mapSize;

     // Set to track currently stuff
    const deadPlayers = new Set();
    let lastCargoShipSpawned = false;
    let lastPatrolHeliSpawned = false;
    let lastLockedCrateSpawned = false;
    setInterval(async () => {
        try {
            const teamInfoResponse = await rustplus.sendRequestAsync({ getTeamInfo: {} }, 20000);
            const teamMembers = teamInfoResponse.teamInfo.members;
            const playerCoordinates = [];
            //console.log(teamInfoResponse.teamInfo.mapNotes , teamInfoResponse.teamInfo.leaderMapNotes);
            teamMembers.forEach(member => {
                if (!member.isAlive && member.isOnline) {
                    // If a member is dead and not already in the deadPlayers set, send a message
                    if (!deadPlayers.has(member.name)) {
                        rustplus.sendTeamMessage(`Clan - [${member.name}] - Died at ${getGridPos(member.x, member.y, mapSize)}`);
                        // Send Discord Webhook Message
                        sendDiscordWebhookMessage(webhookurl_array, `Clan - [${member.name}] - Died at ${getGridPos(member.x, member.y, mapSize)}`);
                        deadPlayers.add(member.name); // Add to dead players set
                    }
                } else if (member.isOnline) {
                    // If they are alive and were previously marked dead, remove from deadPlayers
                    if (deadPlayers.has(member.name)) {
                        deadPlayers.delete(member.name); // Remove from dead players
                    }
                    playerCoordinates.push({
                        name: member.name,
                        coordinates: {
                            x: member.x,
                            y: member.y
                        },
                        isAlive: member.isAlive
                    });
                }
                //console.log(`Player: ${member.name} - Status: ${member.isAlive ? 'Alive' : 'Dead'}`);
            });


            // Get Map Markers
            const MapmMarkerResponse = await rustplus.sendRequestAsync({ getMapMarkers: {} }, 20000);
            MapMarkers = MapmMarkerResponse.mapMarkers.markers;
            //console.log(MapmMarkerResponse);

            // // Storage Monitor stuff
            // const entityResponse = await rustplus.sendRequestAsync({ entityId: 5881931 , getEntityInfo: {} }, 20000);
            // console.log(entityResponse.entityInfo.payload.items);

            /*
            itemId , -2099697608 = stone
            itemId , -151838493 = wood
            itemId , 69511070 = metal
            itemId , 317398316 = HQM
            itemId , -858312878 = Cloth
            itemId , -932201673 = Scrap
            */

            // // TC Upkeep Time
            // tc_upkeep_time = entityResponse.entityInfo.payload.protectionExpiry;
            // // console.log(tc_upkeep_time)
            // tc_upkeep_time = new Date(tc_upkeep_time * 1000);

            // const gmtPlus8Time = new Date(tc_upkeep_time.getTime() + 8 * 60 * 60 * 1000);
            // const gmtPlus8String = gmtPlus8Time.toUTCString();
            // console.log(`TC Upkeep Time: ${gmtPlus8String}`);
            
            // Map Stuff

            // const mapResponse = await rustplus.sendRequestAsync({ getMap: {} }, 20000);

            // const width = mapResponse.map.width;
            // const height = mapResponse.map.height;
            // const oceanMargin = mapResponse.map.oceanMargin;
            // const mapSize = serverInfoResponse.info.mapSize;
            //console.log(mapResponse.map)
            fs.writeFileSync('map.jpg', mapResponse.map.jpgImage);
            console.log('Map retrieved and saved as map.jpg');

            // Load map image and draw player coordinates
            const image = await loadImage('map.jpg');
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);
            
            //console.log(playerCoordinates);
            playerCoordinates.forEach(player => {
                const parsedCoordinates = calculateImageXY(player.coordinates, width, height, oceanMargin, mapSize);
                ctx.fillStyle = player.isAlive ? 'lime' : 'red';
                ctx.beginPath();
                ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '24px Consolas';
                ctx.fillStyle = 'black';
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

            //console.log(MapMarkers);
            MapMarkers.forEach(marker => {
                // Player: 1
                // Explosion: 2
                // VendingMachine: 3
                // CH47: 4
                // CargoShip: 5
                // Crate: 6
                // GenericRadius: 7
                // PatrolHelicopter: 8

                if (marker.type === 1) { // player
                    // Skip player markers since we're already drawing player coordinates
                } else if (marker.type === 2) {
                    console.log(marker);
                } else if (marker.type === 3) { // VendingMachine
                    
                    const markerData = {
                        x: marker.x,
                        y: marker.y,
                        name: marker.name // Default to 'Unnamed' if no name
                    };

                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'cyan';
                    ctx.fill();
                    ctx.fillStyle = 'black';
                    ctx.font = '12px Consolas';
                    ctx.fillText(marker.name, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
                } else if (marker.type === 4) { // Chinook

                    
                    const markerData = {
                        x: marker.x,
                        y: marker.y,
                        name: marker.name 
                    };

                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'Red';
                    ctx.fill();
                    ctx.font = '16px Consolas';
                    ctx.fillStyle = 'White';
                    ctx.fillText("Chinook", parsedCoordinates.x + 6, parsedCoordinates.y + 6);

                }  else if (marker.type === 5) { // CargoShip
                    console.log(lastCargoShipSpawned);
                    if (!lastCargoShipSpawned) {
                        rustplus.sendTeamMessage(`Cargo Ship has spawned !`);
                        lastCargoShipSpawned = true; // Update the flag
                    }
                    const markerData = {
                        x: marker.x,
                        y: marker.y,
                        name: marker.name 
                    };

                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'Red';
                    ctx.fill();
                    ctx.font = '16px Consolas';
                    ctx.fillStyle = 'White';
                    ctx.fillText("Cargo", parsedCoordinates.x + 6, parsedCoordinates.y + 6);

                }  else if (marker.type === 6) { // Locked Crate
                    const markerData = {
                        x: marker.x,
                        y: marker.y,
                        name: marker.name 
                    };

                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'Red';
                    ctx.fill();
                    ctx.font = '16px Consolas';
                    ctx.fillStyle = 'White';
                    ctx.fillText("Locked Crate", parsedCoordinates.x + 6, parsedCoordinates.y + 6);

                }  else if (marker.type === 7) { // Red Circle Radius? like for train
                    // const markerData = {
                    //     x: marker.x,
                    //     y: marker.y,
                    //     name: marker.name 
                    // };

                    // const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    // ctx.beginPath();
                    // ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    // ctx.fillStyle = 'Red';
                    // ctx.fill();
                    // ctx.font = '16px Consolas';
                    // ctx.fillStyle = 'White';
                    // ctx.fillText("Unknown", parsedCoordinates.x + 6, parsedCoordinates.y + 6);

                } else if (marker.type === 8) { // PatrolHelicopter

                    if (!lastPatrolHeliSpawned) {
                        rustplus.sendTeamMessage('Patrol Helicopter has spawned!');
                        lastPatrolHeliSpawned = true; // Update the flag
                    }

                    const markerData = {
                        x: marker.x,
                        y: marker.y,
                        name: marker.name 
                    };

                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'Red';
                    ctx.fill();
                    ctx.font = '16px Consolas';
                    ctx.fillStyle = 'White';
                    ctx.fillText("PatrolHelicopter", parsedCoordinates.x + 6, parsedCoordinates.y + 6);
                }
                // } else {
                //     lastCargoShipSpawned = false;
                //     lastPatrolHeliSpawned = false;
                //     lastLockedCrateSpawned = false;
                // }
            });

            // Player Markers / LEader Markers
            const playermapnotes = teamInfoResponse.teamInfo.mapNotes
            const leadermapnotes = teamInfoResponse.teamInfo.leaderMapNotes

            playermapnotes.forEach(marker => {
                // console.log(marker);
                const markerData = {
                    x: marker.x,
                    y: marker.y,
                    type: marker.type,
                };
                if (marker.type === 0) {
                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                    ctx.font = '20px Consolas';
                    ctx.fillStyle = 'red';
                    ctx.fillText(`Last Death`, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
                } else if (marker.type === 1) {
                    const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                    ctx.beginPath();
                    ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'Yellow';
                    ctx.fill();
                    ctx.font = '20px Consolas';
                    ctx.fillStyle = 'black';
                    ctx.fillText(`Marker`, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
                }
            });

            leadermapnotes.forEach(marker => {
                // console.log(marker);
                const markerData = {
                    x: marker.x,
                    y: marker.y,
                    type: marker.type,
                };
                const parsedCoordinates = calculateImageXY(markerData, width, height, oceanMargin, mapSize);
                ctx.beginPath();
                ctx.arc(parsedCoordinates.x, parsedCoordinates.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'Yellow';
                ctx.fill();
                ctx.font = '20px Consolas';
                ctx.fillStyle = 'black';
                ctx.fillText(`Leader Marker`, parsedCoordinates.x + 6, parsedCoordinates.y + 6);
 
            });

            // Save the updated image with player coordinates
            const buffer = canvas.toBuffer('image/jpeg');
            fs.writeFileSync('map_with_players.jpg', buffer);
            console.log('Map with player coordinates saved as map_with_players.jpg');

        } catch (error) {
            console.error('Error retrieving data:', error);
        }
    }, 3000);
});

rustplus.on('disconnected', () => console.log('Disconnected from RustPlus server'));
rustplus.on('error', (error) => console.error('WebSocket error:', error));
