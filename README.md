# rps-multiplayer
UW Coding Bootcamp Homework - RPS Multiplayer using Firebase
## User Story
- [ ] Only two users can play at the same time.
- [ ] Both players pick either `rock`, `paper` or `scissors`. After the players make their selection, the game will tell them whether a tie occurred or if one player defeated the other.
- [ ] The game will track each player's wins and losses.
- [ ] Throw some chat functionality in there! No online multiplayer game is complete without having to endure endless taunts and insults from your jerk opponent.
- [ ] Styling and theme are completely up to you. Get Creative!
## notes
### firebase data structure (initial thoughts)
```javascript
{
	players: {
		elaine: {
			name: "elaine",
			score: 0
		},
		john: {
			name: "john",
			score: 0
		}
	},
	tables: {
		1: {
			id: 1,
			name: "table 1",
			player1: "john",
			player1-choice: "rock",
			player2: "elaine",
			player2-choice: "lizard"
		}
	},
	chat: {
		0: {}
	}
}
```