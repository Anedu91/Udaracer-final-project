// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
  player_segment: 0,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;
      // Race track form field
      if (target.matches(".card.track") || target.matches("track-item")) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches(".card.podracer") || target.matches("podracer-item")) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  const { player_id, track_id } = store;
  if (!player_id || !track_id) {
    alert("Please select track or racer");
    location.reload();
  }
  try {
    // render starting UI
    renderAt("#race", renderRaceStartView(track_id));

    const race = await createRace(player_id, track_id);
    store.race_id = parseInt(race.ID) - 1;
    // The race has been created, now start the countdown
    await runCountdown();
    console.log(race);

    await startRace(store.race_id);

    await runRace(store.race_id);
  } catch (err) {
    console.log("Error with handleCreateRace::", err);
  }
}

async function runRace(raceID) {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const race = await getRace(raceID);
      if (race.status === "in-progress") {
        renderAt("#leaderBoard", raceProgress(race.positions));
      } else {
        clearInterval(interval);
        renderAt("#race", resultsView(race.positions));
        resolve();
      }
    }, 500);
  }).catch((err) => console.log("Error with runRace::", err));
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    // await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        // run this DOM manipulation to decrement the countdown for the user
        document.getElementById("big-numbers").innerHTML = --timer;
        if (timer === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  console.log("selected a pod", target.id);

  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  store.player_id = target.id;
}

function handleSelectTrack(target) {
  console.log("selected a track", target.id);

  // remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  store.track_id = target.id;
}

function handleAccelerate() {
  console.log("accelerate button clicked");
  store.player_segment++;
  accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3 class="podracer-item">${driver_name}</h3>
			<p class="podracer-item">Speed: ${top_speed}</p>
			<p class="podracer-item">Acceleration: ${acceleration}</p>
			<p class="podracer-item">Handling: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3 class="track-item">${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
    <main>
      <section class="results">
			${raceProgress(positions)}
			<a href="/race" class="new-race">Start a new race</a>      
      </section>
		</main>
	`;
}

function raceProgress(positions) {
  const userPlayer = positions.find((e) => e.id == store.player_id);
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions
    .map((p) => {
      const progress = (p.segment * 100) / 201;
      return `
			<tr>
				<td class="flex">
          <h3>${count++} - ${p.driver_name}</h3>  
          <div class="progress">
            <div id="myBar" style="width:${progress}%"></div>
          </div>
				</td>
			</tr>
		`;
    })
    .join("");

  return `
		<div class="results__table">
			<h2>Leaderboard</h2>
			<div id="leaderBoard">
				${results}
			</div>
		</div>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

async function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  try {
    const response = await fetch(`${SERVER}/api/tracks`, defaultFetchOpts);
    const tracks = response.json();
    return tracks;
  } catch (err) {
    console.log("Problem with getTracks request::", err);
  }
}

async function getRacers() {
  // GET request to `${SERVER}/api/cars`
  try {
    const response = await fetch(`${SERVER}/api/cars`, defaultFetchOpts);
    const racers = response.json();
    return racers;
  } catch (err) {
    console.log("Problem with getRacers request::", err);
  }
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    dataType: "jsonp",
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  try {
    const response = await fetch(`${SERVER}/api/races/${id}`);
    const race = response.json();
    return race;
  } catch (err) {
    console.log("Problem with getRace request::", err);
  }
}

function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: "POST",
    ...defaultFetchOpts(),
  })
    .then((res) => console.log("Starting the race"))
    .catch((err) => console.log("Problem with startRace request::", err));
}

function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    ...defaultFetchOpts(),
  })
    .then((res) => {})
    .catch((err) => console.log("Problem with accelerate request::", err));
}
