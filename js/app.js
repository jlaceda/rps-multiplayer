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
	playerSlot: 0,
	playerName: null,
	opponentName: null,	
	tableName: null,
	isPlaying: false,
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
	return playerRef.transaction((player) =>
	{
		if (player === null)
		{
			return {
				"name": name,
				"wins": 0,
				"losses": 0,
				"online": true
			};
		}
		else if (player !== null && player.online === false)
		{
			console.log("Player exists and is offline. Setting online status.");
			player.online = true;
			return player;
		}
		else if (player !== null && player.online === true)
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
		console.log('Logged in as ' + name);
		console.log("Game State: ", game);
		$("#nameForm").html(`<h3>Welcome ${name}!</h3>`);
		renderTables();
		// set offline onDisconnect
		db.ref("players/" + name).onDisconnect().update({
			"online": false
		});
	});
};

const renderTables = () =>
{
	$("#gameDisplay").html(`
	<div class="card">
		<div class="card-header">Tables</div>
		<ul class="list-group list-group-flush" id="tables"></ul>
	</div>`);
	$("#tables").on("click",".joinButton",(event)=>{
		event.preventDefault();
		const tableName = $(event.target).data("table");
		joinTable(tableName);
		console.log("joined table " + tableName);
	});
	db.ref("tables").on('child_added', (childSnapshot) =>
	{
		const table = childSnapshot.val();
		const joinButton = `<button type="button" class="btn btn-primary btn-sm joinButton" data-table="${table.name}">join</button>`;
		if (table.player1 === undefined) table.player1 = joinButton;
		if (table.player2 === undefined) table.player2 = joinButton;
		
		$("#tables").append([table].map(tableTemplate).join(''));
	});
};

db.ref("tables").on("child_changed", () =>
{
	if (game.playerName === null) return;
	if (game.isPlaying) return;
	renderTables();
});

const renderGame = () =>
{
	$("#gameDisplay").html(`
	<div class="col-md-6">
	<h4>Table: ${game.tableName === null ? '': game.tableName} Opponent: ${game.opponentName === null ? '': game.opponentName}</h4>
		<div id="weapons">
			<p>Choose your weapon:</p>
			<button type="button" class="btn btn-light btn-lg weapon" data-value="rock">✊</button>
			<button type="button" class="btn btn-light btn-lg weapon" data-value="paper">📝</button>
			<button type="button" class="btn btn-light btn-lg weapon" data-value="scissors">✂️</button>
			<button type="button" class="btn btn-light btn-lg weapon" data-value="lizard">🦎</button>
			<button type="button" class="btn btn-light btn-lg weapon" data-value="spock">🖖</button>
		</div>
	</div>`);
	$("#gameDisplay .weapon").click((event) =>
	{
		event.preventDefault();
		const choice = $(event.target).data("value");
		console.log(game.playerName,"chooses",choice)
		db.ref("tables/" + game.tableName).child("player"+game.playerSlot+"Choice").set(choice);
		renderGame();
	});
}

const compare = (p1Choice, p2Choice) =>
{
	// scissors cuts 
	// paper covers 
	// rock crushes 
	// lizard poisons 
	// spock smashes 
	// scissors decapitates 
	// lizard eats 
	// paper disproves 
	// spock vaporizes 
	// rock crushes scissors
	if (p1Choice === p2Choice) return 0;
	if (p1Choice === "scissors" && (p2Choice === "paper" || p2Choice === "lizard")) return 1;
	if (p1Choice === "paper" && (p2Choice === "rock" || p2Choice === "spock")) return 1;
	if (p1Choice === "rock" && (p2Choice === "lizard" || p2Choice === "scissors")) return 1;
	if (p1Choice === "lizard" && (p2Choice === "paper" || p2Choice === "spock")) return 1;
	if (p1Choice === "spock" && (p2Choice === "scissors" || p2Choice === "rock")) return 1;
	return 2;
};

// TODO:
// on table change
// update local game state based on db values
const playing = (tableSnapshot) =>
{
	
	console.log("table changed")
	if (!game.isPlaying) return;
	const tableState = tableSnapshot.val();
	console.log(tableState)
	// only check after both player1Choice and player1Choice are not null
	if (tableState.player1Choice == null || tableState.player2Choice == null)
	{
		console.log("someone hasn't chosen yet");
		console.log(tableState);
		return;
	}

	console.log("playing game")
	const result = compare(tableState.player1Choice, tableState.player2Choice);
	if (result === 0)
	{
		tiedRound();
	}
	else if (game.playerSlot === result)
	{
		wonRound();
	}
	else
	{
		lostRound()
	}
	renderGame();
};

// joins a table
const joinTable = (tableName) =>
{
	// log in first
	if (game.playerName === null) return;
	// leave current table
	game.opponentName = null;
	game.tableName = null;

	var tableRef = db.ref("tables/" + tableName);

	tableRef.transaction((table) =>
	{
		if (table === null)
		{
			console.log("Table doesn't exist. Creating new table.");
			game.playerSlot = 1;
			return {
				"name": tableName,
				"player1": game.playerName
			};
		}
		else // join table
		{
			console.log("Table exists. Joining table.");
			if (table.player1 == null)
			{
				console.log("Join in player1 slot.");
				game.playerSlot = 1;
				table.player1 = game.playerName;
				
				return table;
			}
			else if (table.player2 == null)
			{
				console.log("Join in player2 slot.");
				game.playerSlot = 2;
				table.player2 = game.playerName;
				game.opponentName = table.player1;
				return table;
			}
			else
			{
				// TODO
				console.log("Table is full");
				return;
			}
		}
	}, (error, committed, snapshot) =>
	{
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
		const tableSnapshot = snapshot.val()
		game.tableName = tableSnapshot.name;

		if (game.opponentName == null)
		{
			renderGame();
			const waitForOpponent = (table) =>
			{
				const t = table.val();
				if (!t.player2) return;
				
				game.opponentName = t.player2;
				db.ref("tables/" + game.tableName).off("value", waitForOpponent);
				console.log(game.opponentName + " has joined");
				console.log("ready to play");
				game.isPlaying = true;
				renderGame();
				db.ref("tables/" + game.tableName).on("value", playing);
			};
			console.log("waiting for opponent to join");
			db.ref("tables/" + game.tableName).on("value", waitForOpponent);
		}
		else
		{
			console.log("ready to play");
			game.isPlaying = true;
			renderGame();
			db.ref("tables/" + game.tableName).on("value", playing);
		}
		
		console.log("Game State: ", game);

	})
	.then(() =>
	{
		// leave table onDisconnect
		db.ref("tables/" + game.tableName + "/player" + game.playerSlot).onDisconnect().set(null);
		db.ref("tables/" + game.tableName).child("player" + game.playerSlot+"Choice").onDisconnect().set(null);
		
	});
	
};

// only the loser should be able to update score on db
const lostRound = () => 
{
	// TODO: update dom
	// update db
	let opponentWinsRef = db.ref("player/" + game.opponentName + "/wins");
	let playerLossesRef = db.ref("player/" + game.playerName + "/losses");
	opponentWinsRef.transaction((wins) =>
	{
		return wins + 1;
	});
	playerLossesRef.transaction((losses) =>
	{
		return losses + 1;
	});
	db.ref("tables/" + game.tableName).child("player1Choice").set(null);
	db.ref("tables/" + game.tableName).child("player2Choice").set(null);
};

// TODO: 
const wonRound = () => 
{
	// inc/dec scores
	// update dom
};

/* DOM Events */

$("#play").click((event) =>
{
	event.preventDefault();
	const name = $("#name").val().trim();
	login(name);
});



const tableTemplate = (table) => `
<li class="list-group-item">
	<h6>${table.name}</h6>
	<span>${table.player1}</span> VS <span>${table.player2}</span>
</li>
`;

// document on ready
$(()=>{
	
});