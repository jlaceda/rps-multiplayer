"use strict";

// Initialize Firebase
firebase.initializeApp({
	apiKey: "AIzaSyDFBs9C2_jKH3iPcb1Nr-s-5RFTu_krlec",
	authDomain: "r-p-s-l-s-5ae48.firebaseapp.com",
	databaseURL: "https://r-p-s-l-s-5ae48.firebaseio.com",
	projectId: "r-p-s-l-s-5ae48",
	storageBucket: "r-p-s-l-s-5ae48.appspot.com",
	messagingSenderId: "123980255075"
});

let game = {
	playerName: null,
	playerWins: 0,
	playerLosses: 0,
	oppenentName: null,
	oppenentWins: 0,
	oppenentLosses: 0,
	tableName: null
}

let db = firebase.database();

/*

player object
"john": {
	"name": "john",
	"wins": 0,
	"losses": 0,
	"table": "table1"
}

table object
"table1": {
	"name": "table1",
	"player1": "john",
	"player1-choice": "rock",
	"player2": "elaine",
	"player2-choice": "scissors"
}

*/

// log into the game, validates user.
const login = (name) =>
{
	// make sure player doesn't exist yet
	var playerRef = db.ref("players/" + name);
	playerRef.transaction((player) =>
	{
		if (player === null)
		{
			console.log("Player doesn't exist. Creating new player.");
			return {
				"name": name,
				"wins": 0,
				"losses": 0,
				"online": true
			};
		}

		if (player !== null && player.online === false)
		{
			console.log("Player exists and is offline. Setting online status.");
			player.online = true;
			return player;
		}

		if (player !== null && player.online === true)
		{
			console.error("Player exists and is online. Abort login.");
			return;
		}

	}, (error, committed, snapshot) => {
		if (error)
		{
			console.error('Transaction failed abnormally!', error);
			return;
		}

		if (!committed)
		{
			console.error('We aborted the transaction because of double login.');
			// TODO: update the markup to reflect this.
			return;
		}
		// update local game object
		const p = snapshot.val();
		game.playerName = p.name;
		game.playerWins = p.wins;
		game.playerLosses = p.losses;
		console.log('Logged in as ' + name);
		console.log("Game State: ", game);
	}).then(() => {
		db.ref("players/" + name).onDisconnect().update({
			"online": false
		});
	});
};

// joins a table
const joinTable = (tableName) => {
	if (game.playerName === null) return;
	var tableRef = db.ref("tables/" + tableName);

	tableRef.transaction((table) =>
	{
		if (table === null)
		{
			console.log("Table doesn't exist. Creating new table.");
			return {
				"name": tableName,
				"player1": game.playerName
			};
		}

		if (table !== null)
		{
			// join table
			// TODO: currently can't join as player2
			console.log("Table exists. Joining table.");
			if (table.player1 === null)
			{
				table.player1 = game.playerName;
				if (table.player2 !== null)
				{
					game.oppenentName = table.player2;
				}
				return table;
			}
			else if (table.player2 === null)
			{
				table.player2 = game.playerName;
				if (table.player1 !== null)
				{
					game.oppenentName = table.player1;
				}
				return table;
			} else
			// TODO
			console.log("Table is full");
			return;
		}

	}, (error, committed, snapshot) => {
		if (error)
		{
			console.error('Transaction failed abnormally!', error);
			return;
		}

		if (!committed)
		{
			console.log('We aborted the transaction because the table is full.');
			// TODO: update the markup to reflect this.
			return;
		}
		// update local game object
		const t = snapshot.val();
		game.tableName = t.name;
		if (game.oppenentName === null)
		{
			console.log("waiting for opponent to join");
		}
		else
		{
			console.log("ready to play");
		}
		
		console.log("Game State: ", game);
	}).then(() => {
		db.ref("players/" + name).onDisconnect().update({
			"online": false
		});
	});
	
};

// TODO: only the loser should be able to update score on db
const lostRound = () => 
{
	// inc/dec scores
	// update dom
	// update db
};

// TODO: 
const wonRound = () => 
{
	// inc/dec scores
	// update dom
};

// TODO:
// on table change
// update local game state based on db values


/* DOM Events */

$("#play").click((event) =>
{
	event.preventDefault();
	const name = $("#name").val().trim();
	login(name);
	$("#name").val('');
});

$("#game button").click((event) =>
{
	event.preventDefault();
	const choice = $(event.target).data("value");
	console.log(game.playerName,"chooses",choice)
	
});