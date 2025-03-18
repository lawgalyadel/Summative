let selectedLeague = "";

document.getElementById("LeagueSection").addEventListener("change", function () {
    selectedLeague = this.value; // Updated to use the outer `selectedLeague`
    generateLeagueTable(selectedLeague);
    updateAwardsDropdowns(selectedLeague);
});

let leagueData = {};
let awardData = {};

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        leagueData = data.leagueData;
        awardData = data.awardData;
        const initialLeague = Object.keys(leagueData)[0];
        selectedLeague = initialLeague; // Ensure the selected league is set on initial load
        generateLeagueTable(selectedLeague); // Generate the table for the first league
        updateAwardsDropdowns(selectedLeague); // Update award dropdowns
    })
    .catch(error => console.error('Error loading JSON data:', error));

function generateLeagueTable(selectedLeague) {
    const leagueTableContainer = document.getElementById("LeagueTableContainer");
    leagueTableContainer.innerHTML = ""; // Clear previous content

    if (leagueData[selectedLeague]) {
        const table = document.createElement("table");
        const headerRow = document.createElement("tr");
        const headers = ["Position", "Team", "Reorder"];
        headers.forEach(headerText => {
            const header = document.createElement("th");
            header.textContent = headerText;
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        leagueData[selectedLeague].forEach(team => {
            const row = document.createElement("tr");

            const positionCell = document.createElement("td");
            positionCell.textContent = team.position;

            const teamCell = document.createElement("td");
            const teamLogo = document.createElement("img");
            teamLogo.src = team.image;
            teamLogo.alt = team.team;
            teamCell.appendChild(teamLogo); 
            teamCell.appendChild(document.createTextNode(team.team));

            const dropdownCell = document.createElement("td");
            const dropdown = document.createElement("select");
            for (let i = 1; i <= leagueData[selectedLeague].length; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i;
                if (i === team.position) {
                    option.selected = true;
                }
                dropdown.appendChild(option);
            }

            dropdown.addEventListener("change", function () {
                moveTeam(selectedLeague, team.team, parseInt(this.value));
                generateLeagueTable(selectedLeague); 
            });

            dropdownCell.appendChild(dropdown);
            row.appendChild(positionCell);
            row.appendChild(teamCell);
            row.appendChild(dropdownCell);
            table.appendChild(row);
        });

        leagueTableContainer.appendChild(table);
    } else {
        leagueTableContainer.innerHTML = "<p>No data available for this league.</p>"; 
    }
}

function moveTeam(leagueName, teamName, newPosition) {
    const league = leagueData[leagueName];
    if (!league) return;
    const oldIndex = league.findIndex(t => t.team === teamName);
    const newIndex = newPosition - 1;
    if (oldIndex === -1 || oldIndex === newIndex) return; // No change needed
    [league[oldIndex], league[newIndex]] = [league[newIndex], league[oldIndex]];
    league[oldIndex].position = oldIndex + 1;
    league[newIndex].position = newIndex + 1;
    generateLeagueTable(leagueName);
}

function updateAwardsDropdowns(selectedLeague) {
    const awardDropdowns = {
        "TopScorer": document.getElementById("TopScorer"),
        "PlayerOfTheSeason": document.getElementById("PlayerOfTheSeason"),
        "YoungPlayerOfTheSeason": document.getElementById("YoungPlayerOfTheSeason"),
        "GoldenGlove": document.getElementById("GoldenGlove"),
        "SigningOfTheSeason": document.getElementById("SigningOfTheSeason"),
        "TopAssister": document.getElementById("TopAssister")
    };

    if (awardData[selectedLeague]) {
        Object.keys(awardDropdowns).forEach(category => {
            const dropdown = awardDropdowns[category];

            if (dropdown) {
                dropdown.innerHTML = '<option value="" disabled selected>Select a Player</option>'; // Reset options

                if (awardData[selectedLeague][category]) {
                    awardData[selectedLeague][category].forEach(player => {
                        const option = document.createElement("option");
                        option.value = player;
                        option.textContent = player;
                        dropdown.appendChild(option);
                    });
                }
            }
        });
    }
}

function submitPrediction() {
    const selectedLeague = document.getElementById("LeagueSection").value;
    const name = document.getElementById("name").value.trim();
    const playerPredictions = {
        topScorer: document.getElementById("TopScorer").value,
        playerOfTheSeason: document.getElementById("PlayerOfTheSeason").value,
        youngPlayerOfTheSeason: document.getElementById("YoungPlayerOfTheSeason").value,
        goldenGlove: document.getElementById("GoldenGlove").value,
        signingOfTheSeason: document.getElementById("SigningOfTheSeason").value,
        topAssister: document.getElementById("TopAssister").value
    };

    const leagueRankings = {};
    const leagueTableContainer = document.getElementById("LeagueTableContainer");
    const rows = leagueTableContainer.querySelectorAll("tr");

    rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row

        const teamName = row.querySelector("td:nth-child(2)").textContent.trim();
        const dropdown = row.querySelector("select");
        const selectedPosition = dropdown ? dropdown.value : null;
        
        if (selectedPosition) {
            leagueRankings[selectedPosition] = teamName;
        }
    });
    
    if (!selectedLeague || !name || Object.keys(leagueRankings).length === 0 || Object.values(playerPredictions).includes("")) {
        alert("Please fill all required fields!");
        return;
    }

    const predictionData = {
        league: selectedLeague,
        name: name,
        predictions: playerPredictions,
        rankings: leagueRankings
    };

    console.log("Submitting:", predictionData);

    fetch('http://localhost:3000/PredictionsSubmission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictionData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); 
    })
    .then(data => {
        alert("Prediction submitted successfully!");
        document.getElementById("LeagueSection").value = "";
        document.getElementById("name").value = "";
        document.querySelectorAll("select").forEach(select => {
            select.value = "";
        });
    })
    .catch(error => {
        console.error('Error submitting prediction:', error);
        alert("Failed to submit prediction.");
    });
}

async function fetchPredictions() {
    try {
        const response = await fetch('http://localhost:3000/Predictions');
        if (response.ok) {
            const predictions = await response.json();
            const commentBoxesContainer = document.getElementById('CommentBoxesContainers');
            commentBoxesContainer.innerHTML = '';  
            predictions.forEach((prediction) => {
                const commentDiv = document.createElement('div');
                commentDiv.classList.add('Comment');
                commentDiv.dataset.id = prediction.id;
                commentDiv.innerHTML = `
                    <h5>${prediction.name} - ${prediction.league}</h5>
                    <p><strong>Top Scorer:</strong> ${prediction.predictions.topScorer}</p>
                    <p><strong>Player of the Season:</strong> ${prediction.predictions.playerOfTheSeason}</p>
                    <p><strong>Young Player of the Season:</strong> ${prediction.predictions.youngPlayerOfTheSeason}</p>
                    <p><strong>Golden Glove:</strong> ${prediction.predictions.goldenGlove}</p>
                    <p><strong>Signing of the Season:</strong> ${prediction.predictions.signingOfTheSeason}</p>
                    <p><strong>Top Assister:</strong> ${prediction.predictions.topAssister}</p>
                    <p><strong>Ranking:</strong> ${Object.entries(prediction.rankings).map(([rank, team]) => `${rank}. ${team}`).join('<br>')}</p>
                `;
                commentBoxesContainer.appendChild(commentDiv);
            });
        } else {
            console.error('Error fetching predictions');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
window.onload = function() {
    fetchPredictions();
};
