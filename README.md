# SoraHub Rust+ Integration 

![map_with_players](https://github.com/user-attachments/assets/bd69fcca-009c-4c46-891d-97587fe44040)
# How to use
1. npx @liamcottle/rustplus.js fcm-register
2. npx @liamcottle/rustplus.js fcm-listen
   then pair on server <-> client app then pair with stoage monitors or any other entities
3. idk im too lazy to document read it :D

# Example Logs
```
Connecting to RustPlus server...
Connected to RustPlus server
Player: Ligma_Deek - Status: Alive
Player: mimichan - Status: Alive
Player: Sora - Status: Alive
Player: muffetasher - Status: Alive
Player: lBigC - Status: Alive


[
  Item { itemId: -2099697608, quantity: 1986, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 1536, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 2000, itemIsBlueprint: false },
  Item { itemId: -151838493, quantity: 1549, itemIsBlueprint: false },
  Item { itemId: 317398316, quantity: 152, itemIsBlueprint: false },
  Item { itemId: 69511070, quantity: 23, itemIsBlueprint: false },
  Item { itemId: -2099697608, quantity: 1528, itemIsBlueprint: false },
  Item { itemId: -144417939, quantity: 1, itemIsBlueprint: false },
  Item { itemId: 1525520776, quantity: 1, itemIsBlueprint: false }
]
TC Upkeep Time: Tue, 05 Nov 2024 04:25:23 GMT
Map retrieved and saved as map.jpg
[
  {
    name: 'Ligma_Deek',
    coordinates: { x: 2766.49951171875, y: 2446.04296875 },
    isAlive: true
  },
  {
    name: 'mimichan',
    coordinates: { x: 2774.950927734375, y: 2437.210205078125 },
    isAlive: true
  },
    coordinates: { x: 2762.942626953125, y: 2431.398193359375 },
    isAlive: true
  },
  {
    name: 'muffetasher',
    coordinates: { x: 2774.099609375, y: 2435.535888671875 },
    isAlive: true
  },
  {
    name: 'lBigC',
    coordinates: { x: 2772.814208984375, y: 2439.708251953125 },
    isAlive: true
  }
]
Map with player coordinates saved as map_with_players.jpg
Player: Ligma_Deek - Status: Alive
Player: mimichan - Status: Alive
Player: Sora - Status: Alive
Player: muffetasher - Status: Alive
Player: lBigC - Status: Alive
```

# TODO
1. Add Discord Integration
2. Add Notifications pipe to chat
3. acertain map grid coordinates via x & y coords
