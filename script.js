const initialContainer = document.getElementById('initial-state-container');
const goalContainer = document.getElementById('goal-state-container'); // Added
const exportBtn = document.getElementById('export-btn');
const toolsContainer = document.getElementById('tools');
const goalToolsContainer = document.getElementById('goal-tools');


let mapWidth = 13; // Changed from const to let
let mapHeight = 7; // Changed from const to let
let selectedType = ' ';
let isDrawing = false;
let initialMap = [];
let initialAgentCounter = 0 // Counter for agents in the initial state
let initialBoxCounter = 0; // Counter for boxes in the initial state

let goalAgentCounter = 0; // Counter for agents in the goal state
let goalBoxCounter = 0; // Counter for boxes in the goal state

let historyStack = []; // To store the grid's history


// Initialize map data with walls on the perimeter and empty inside
let mapData = Array.from({ length: mapHeight }, (_, y) =>
 Array.from({ length: mapWidth }, (_, x) =>
 (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
 )
);
let goalMapData = Array.from({ length: mapHeight }, (_, y) =>
  Array.from({ length: mapWidth }, (_, x) =>
    (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
  )
);

function saveCurrentState() {
  const currentState = {
    goalMapData: JSON.parse(JSON.stringify(goalMapData)), // Deep copy of the goal state
    goalAgentCounter,
    goalBoxCounter,
  };
  historyStack.push(currentState);
}


initialMap = JSON.parse(JSON.stringify(mapData)); // Copy initial map for future use
// Create grid
function createGrid() {
  initialContainer.innerHTML = '';

  // Set dynamic grid styles
  initialContainer.style.gridTemplateColumns = `repeat(${mapWidth}, 40px)`;
  initialContainer.style.gridTemplateRows = `repeat(${mapHeight}, 40px)`;
  initialContainer.style.gridGap = '2px';

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.textContent = mapData[y][x];
      updateCellClass(cell, mapData[y][x]);
      cell.addEventListener('mousedown', () => startDrawing(cell, x, y));
      cell.addEventListener('mouseover', () => draw(cell, x, y));
      cell.addEventListener('mouseup', stopDrawing);
      initialContainer.appendChild(cell);
    }
  }
}



const widthInput = document.getElementById('grid-width');
const heightInput = document.getElementById('grid-height');

// Add event listeners to update the grid dynamically on input
widthInput.addEventListener('input', updateGridSize);
heightInput.addEventListener('input', updateGridSize);

function updateGridSize() {
  const newWidth = parseInt(widthInput.value);
  const newHeight = parseInt(heightInput.value);

  // Validate inputs
  if (newWidth < 3 || newWidth > 20 || newHeight < 3 || newHeight > 20) {
    return; // Ignore invalid values
  }

  // Update grid size and reset the map data
  mapWidth = newWidth;
  mapHeight = newHeight;

  // Reinitialize mapData and goalMapData for the new grid size
  mapData = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) =>
      (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
    )
  );
  goalMapData = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) =>
      (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
    )
  );

  // Reset counters
  initialAgentCounter = 0;
  initialBoxCounter = 0;
  goalAgentCounter = 0;
  goalBoxCounter = 0;

  // Rebuild grids
  createGrid(); // Rebuild the initial state grid
  createGoalGrid(); // Rebuild the goal state grid
}


function createGoalGrid() {
  const goalContainer = document.getElementById('goal-state-container');
  const initialContainer = document.getElementById('initial-state-container');

  goalContainer.innerHTML = ''; // Clear previous content

  // Use computed styles to copy grid layout from the initial container
  const computedStyles = getComputedStyle(initialContainer);
  goalContainer.style.gridTemplateColumns = computedStyles.gridTemplateColumns;
  goalContainer.style.gridTemplateRows = computedStyles.gridTemplateRows;
  goalContainer.style.gap = computedStyles.gap;
  goalContainer.style.padding = computedStyles.padding;

  // Populate the goal grid
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;

      if (mapData[y][x] === '+') {
        // Retain walls from the initial state
        cell.classList.add('wall');
        cell.textContent = '+';
        goalMapData[y][x] = '+'; // Ensure walls are set in the goal map
      } else {
        // Populate non-wall cells based on goal map data
        cell.textContent = goalMapData[y][x] || '';
        updateCellClass(cell, goalMapData[y][x]);
      }

      // Add event listeners for interactivity in the goal state
      cell.addEventListener('mousedown', () => startDrawingGoal(cell, x, y));
      cell.addEventListener('mouseover', () => drawGoal(cell, x, y));
      cell.addEventListener('mouseup', stopDrawing);

      goalContainer.appendChild(cell);
    }
  }
}


function startDrawingGoal(cell, x, y) {
  isDrawing = true;
  applyGoalTool(cell, x, y);
}

function drawGoal(cell, x, y) {
  if (isDrawing) {
    applyGoalTool(cell, x, y);
  }
}

function stopDrawing() {
  isDrawing = false;

}function startDrawingGoal(cell, x, y) {
  if (selectedType === '1') {
    isDrawing = false; // Disable continuous drawing for boxes
  } else {
    isDrawing = true; // Enable continuous drawing for other types
  }
  applyGoalTool(cell, x, y);
}

function drawGoal(cell, x, y) {
  if (isDrawing) {
    applyGoalTool(cell, x, y);
  }
}

let removedAgents = []; // Track removed agent numbers

function applyGoalTool(cell, x, y) {
  if (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) {
    return; // Skip perimeter cells
  }

  const currentValue = goalMapData[y][x]; // Get the current cell value

  // Prevent placing agents or boxes on walls
  if (currentValue === '+') {
    alert("You cannot place agents or boxes on walls!");
    isDrawing = false;
    return;
  }

  if (selectedType === 'remove') {
    // Handle removing agents or boxes
    if (!isNaN(currentValue) && currentValue !== ' ') {
      // Remove agent
      const agentNumber = parseInt(currentValue);
      goalMapData[y][x] = ' ';
      removedAgents.push(agentNumber); // Add removed agent number to the list
      removedAgents.sort((a, b) => a - b); // Ensure the list remains sorted
    } else if (/^[A-Z]$/.test(currentValue)) {
      // Remove box
      goalMapData[y][x] = ' ';
      goalBoxCounter--; // Decrement box counter
    }
    cell.textContent = ''; // Clear the cell content visually
    updateCellClass(cell, ' '); // Update the class to reflect empty space
    return;
  }

  // Check if the cell is already occupied by an agent or a box
  if (!isNaN(currentValue) && currentValue !== ' ' || /^[A-Z]$/.test(currentValue)) {
    alert("This cell is already occupied by an agent or a box. Choose another cell.");
    isDrawing = false;
    return;
  }

  // Clear the cell content visually (this will be updated below if valid)
  cell.innerHTML = '';

  if (selectedType === '0') {
    // Handle adding a goal agent
    const currentGoalAgents = goalMapData.flat().filter(cell => !isNaN(cell) && cell !== ' ').length;
    if (currentGoalAgents >= initialAgentCounter) {
      alert("Cannot add more agents in the goal state than exist in the initial state!");
      isDrawing = false;
      return;
    }

    // Determine the agent number
    let agentNumber;
    if (removedAgents.length > 0) {
      // Reuse the lowest removed agent number
      agentNumber = removedAgents.shift(); // Remove the number from the list
    } else {
      // Use the next available number
      agentNumber = goalAgentCounter;
      goalAgentCounter++;
    }

    // Assign the agent number
    goalMapData[y][x] = agentNumber.toString();

    // Create a visual representation for the agent
    const agentCircle = document.createElement('div');
    agentCircle.className = 'agent-circle-goal'; // Use goal-specific class
    agentCircle.textContent = agentNumber.toString();
    cell.appendChild(agentCircle);

    isDrawing = false; // Disable continuous painting for agents
  } else if (selectedType === '1') {
    // Handle adding a goal box
    const currentGoalBoxes = goalMapData.flat().filter(cell => /^[A-Z]$/.test(cell)).length;
    if (currentGoalBoxes >= initialBoxCounter) {
      alert("Cannot add more boxes in the goal state than exist in the initial state!");
      return;
    }

    // Prompt for the box letter
    const boxLetter = prompt("Enter a letter for the box (a-z):", 'a');
    if (boxLetter && /^[a-z]$/.test(boxLetter)) {
      const upperBoxLetter = boxLetter.toUpperCase();
      goalMapData[y][x] = upperBoxLetter;

      const boxDiv = document.createElement('div');
      boxDiv.className = 'box-div-goal'; // Use goal-specific class
      boxDiv.textContent = upperBoxLetter;
      cell.appendChild(boxDiv);

      goalBoxCounter++; // Increment goal box counter
    } else {
      alert("Invalid input. Please enter a single letter from a-z.");
      return;
    }
  } else {
    // Handle other cell types
    goalMapData[y][x] = selectedType;
    cell.textContent = selectedType;
  }

  // Apply goal-specific styling
  cell.classList.add('cell-goal');
}








goalContainer.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    const cell = e.target;
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    drawGoal(cell, x, y);
  }
});



// Tool selection
toolsContainer.addEventListener('click', (e) => {
if (e.target.classList.contains('tool')) {
 document.querySelectorAll('.tool').forEach(tool => tool.classList.remove('selected'));
 e.target.classList.add('selected');
 selectedType = e.target.dataset.type;
 }
});

goalToolsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('tool')) {
    document.querySelectorAll('#goal-tools .tool').forEach(tool => tool.classList.remove('selected'));
    e.target.classList.add('selected');
    selectedType = e.target.dataset.type; // Set the selected type for goal mode
  }
});

// Start drawing
initialContainer.addEventListener('mousedown', (e) => {
 e.preventDefault(); // Prevents the default text selection behavior
 isDrawing = true;
});

initialContainer.addEventListener('mouseup', () => isDrawing = false);
initialContainer.addEventListener('mouseleave', () => isDrawing = false);
function startDrawing(cell, x, y) {
// Check if the selected tool is a box
if (selectedType === '1') {
 isDrawing = false; // Disable continuous drawing
 } else {
 isDrawing = true; // Allow continuous drawing for other types
 }
applyTool(cell, x, y);
}
function draw(cell, x, y) {
if (isDrawing) {
applyTool(cell, x, y);
 }
}
function stopDrawing() {
 isDrawing = false;
}


function applyTool(cell, x, y) {
  // Skip if it's a perimeter cell
  if (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) {
    return;
  }

  // Handle removing agents or boxes
  if (selectedType === ' ') {
    const currentValue = mapData[y][x];
    
    // Remove an agent if the cell contains a number
    if (!isNaN(currentValue) && currentValue !== ' ') {
      mapData[y][x] = ' ';
      cell.textContent = '';
      initialAgentCounter--; // Decrement the agent counter
      reindexAgents(); // Reindex agents to maintain order
      isDrawing = false;
      alert("Agent removed from initial state! Re-indexed and goal state reset.");
      resetGoalMapData();
      createGoalGrid()
    } 
    // Remove a box if the cell contains an uppercase letter
    else if (/^[A-Z]$/.test(currentValue)) {
      mapData[y][x] = ' ';
      cell.textContent = '';
      initialBoxCounter--; // Decrement the box counter
      //reindexBoxes(); // Reindex boxes to maintain order
      isDrawing = false;
      alert("Box removed from initial state! Goal state reset.");
      resetGoalMapData();
      createGoalGrid()
    }
    // Simply set the cell to empty if it contains other values
    else {
      mapData[y][x] = ' ';
      cell.textContent = '';
    }
    updateCellClass(cell, ' '); // Update the class to reflect empty space
    isDrawing = false;
    return; // Skip further processing
  }

  // Only allow drawing on walls or empty spaces
  if (mapData[y][x] === '+' || mapData[y][x] === ' ') {
    if (selectedType === '0') {
      // Check if we're exceeding the agent limit
      if (initialAgentCounter >= 10) {
        alert("Cannot place more than 10 agents on a map.");
        selectedType = ' '; // Switch to empty cell type
        return;
      }
      // Place a new agent if not already in the cell
      mapData[y][x] = initialAgentCounter.toString();
      // Create a circle div for the agent
      const agentCircle = document.createElement('div');
      agentCircle.className = 'agent-circle';
      agentCircle.textContent = initialAgentCounter.toString();
      cell.innerHTML = ''; // Clear existing contents
      cell.appendChild(agentCircle);
      initialAgentCounter++;
    } else if (selectedType === '1') {
      isDrawing = false; // Reset drawing state before the prompt
      // Prompt for a letter when placing a box
      const boxLetter = prompt("Enter a letter for the box (a-z):", 'a');
      if (boxLetter && /^[a-z]$/.test(boxLetter)) {
        mapData[y][x] = boxLetter.toUpperCase();
        const boxDiv = document.createElement('div');
        boxDiv.className = 'box-div';
        boxDiv.textContent = boxLetter.toUpperCase();
        cell.innerHTML = ''; // Clear existing contents
        cell.appendChild(boxDiv);
        initialBoxCounter++;
      } else {
        alert("Invalid input. Please enter a single letter from a-z.");
      }
    } else {
      // For empty or wall cells, apply the selected type
      mapData[y][x] = selectedType;
      cell.textContent = selectedType;
    }
    updateCellClass(cell, mapData[y][x]);
  }
}

/**
 * Reindex agents to maintain sequential numbering (0, 1, 2, ...)
 */
function reindexAgents() {
  let agentIndex = 0;
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (!isNaN(mapData[y][x]) && mapData[y][x] !== ' ') {
        mapData[y][x] = agentIndex.toString();
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
          cell.innerHTML = '';
          const agentCircle = document.createElement('div');
          agentCircle.className = 'agent-circle';
          agentCircle.textContent = agentIndex.toString();
          cell.appendChild(agentCircle);
        }
        agentIndex++;
      }
    }
  }
  initialAgentCounter = agentIndex; // Update the agent counter
}


/**
 * Reindex boxes to maintain sequential letters (A, B, C, ...)
 */
function reindexBoxes() {
  const boxLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let boxIndex = 0;
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (/^[A-Z]$/.test(mapData[y][x])) {
        mapData[y][x] = boxLetters[boxIndex];
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
          cell.innerHTML = '';
          const boxDiv = document.createElement('div');
          boxDiv.className = 'box-div';
          boxDiv.textContent = boxLetters[boxIndex];
          cell.appendChild(boxDiv);
        }
        boxIndex++;
      }
    }
  }
  initialBoxCounter = boxIndex; // Update the box counter
}


// Control drawing with mouse events
initialContainer.addEventListener('mousedown', (e) => {
 e.preventDefault(); // Prevents the default text selection behavior
 isDrawing = true;
const cell = e.target;
const x = parseInt(cell.dataset.x);
const y = parseInt(cell.dataset.y);
startDrawing(cell, x, y);
});
initialContainer.addEventListener('mousemove', (e) => {
if (isDrawing) {
const cell = e.target;
const x = parseInt(cell.dataset.x);
const y = parseInt(cell.dataset.y);
draw(cell, x, y);
 }
});
initialContainer.addEventListener('mouseup', () => isDrawing = false);
initialContainer.addEventListener('mouseleave', () => isDrawing = false);

function updateCellClass(cell, type) {
  cell.className = 'cell'; // Reset classes
  if (type === '+') {
    cell.classList.add('wall');
  } else if (!isNaN(type)) { // Check if the type is a number for agents
    cell.classList.add('agent');
  } else if (['A', 'B', 'C', 'D','Z'].includes(type)) {
    cell.classList.add('box');
  }

  // Add goal-specific styles if in goal mode
  if (isGoalMode) {
    if (type === '0') {
      cell.classList.add('agent-circle-goal');
    } else if (['A', 'B', 'C', 'D','Z'].includes(type)) {
      cell.classList.add('box-div-goal');
    }
  }
}


const goalSlider = document.getElementById('goal-slider');

let isGoalMode = false; // Track if we are in goal-setting mode

let goalGridCreated = false; // Flag to track if the goal grid has been created


goalSlider.addEventListener('change', () => {
  isGoalMode = goalSlider.checked;

  if (isGoalMode) {
    console.log("Goal mode activated");

    initialContainer.style.display = 'none'; // Hide the initial container

    // Check if new walls were added or recreate the grid for the first time
    if (!goalGridCreated || wallsChangedInInitialState()) {
      resetGoalMapData(); // Reset the goal map data
      createGoalGrid(); // Recreate the goal grid
      goalGridCreated = true; // Set the flag to true after creating the grid
      goalAgentCounter = 0;
      goalBoxCounter = 0
    }

    goalContainer.style.display = 'grid'; // Show the goal container
    toolsContainer.style.display = 'none'; // Hide initial tools
    document.getElementById('goal-tools').style.display = 'block'; // Show goal tools

    // Lock grid size changes
    widthInput.disabled = true;
    heightInput.disabled = true;
  } else {
    console.log("Goal mode deactivated");

    goalContainer.style.display = 'none'; // Hide the goal container
    initialContainer.style.display = 'grid'; // Show the initial container
    toolsContainer.style.display = 'block'; // Show initial tools
    document.getElementById('goal-tools').style.display = 'none'; // Hide goal tools

    // Unlock grid size changes
    widthInput.disabled = false;
    heightInput.disabled = false;
  }
});

/**
 * Function to check if walls have changed in the initial state.
 * Returns true if walls in `mapData` do not match walls in `goalMapData`.
 */
function wallsChangedInInitialState() {
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const initialCell = mapData[y][x];
      const goalCell = goalMapData[y][x];

      // Check if the cell is a wall in the initial state but not a wall in the goal state
      if (initialCell === '+' && !(goalCell === '+' || /^[0-9]$/.test(goalCell) || /^[a-z]$/.test(goalCell))) {
        return true; // Wall added or removed
      }

      // Check if the cell is empty in the initial state but not in the goal state
      if (initialCell === ' ') {
        // Allow valid transformations: space, numbers ('0-9'), or letters ('a-z', 'A-Z')
        const isValidGoalCell = goalCell === ' ' || /^[0-9]$/.test(goalCell) || /^[a-zA-Z]$/.test(goalCell);

        if (!isValidGoalCell) {
          return true; // Invalid modification of an empty cell
        }
      }
    }
  }
  return false; // No invalid changes detected
}



/**
 * Function to reset the goal map data to match the current initial map data.
 */
function resetGoalMapData() {
  goalMapData = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) =>
      (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
    )
  );
}








const resetBtn = document.getElementById('reset-btn');


resetBtn.addEventListener('click', () => {
  // Add the spin class for the reset animation
  resetBtn.classList.add('spin');

  // Remove the spin class after the animation ends
  setTimeout(() => {
    resetBtn.classList.remove('spin');
  }, 600); // Match the duration of the animation (0.6s)

  // Reset map data for both states
  mapData = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) =>
      (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
    )
  );
  goalMapData = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) =>
      (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) ? '+' : ' '
    )
  );

  // Reset counters
  initialAgentCounter = 0;
  initialBoxCounter = 0;
  goalAgentCounter = 0;
  goalBoxCounter = 0;

  // Rebuild the initial state grid
  createGrid();
  createGoalGrid();

  // Reset tool selections
  document.querySelectorAll('.tool').forEach(tool => tool.classList.remove('selected'));
  selectedType = ' ';

  // Reset goal slider to off
  const goalSlider = document.getElementById('goal-slider');
  goalSlider.checked = false; // Uncheck the goal slider
  isGoalMode = false; // Ensure goal mode is turned off

  // Show the initial state and hide the goal state
  initialContainer.style.display = 'grid';
  goalContainer.style.display = 'none';

  // Reset tool visibility
  toolsContainer.style.display = 'block';
  document.getElementById('goal-tools').style.display = 'none';

  // Enable grid size inputs
  widthInput.disabled = false;
  heightInput.disabled = false;
});



// Export the map
exportBtn.addEventListener('click', () => {
  const hasGoals = goalMapData.some(row => 
    row.some(cell => {
      // A cell with a goal agent ('0') or a goal box ('A-Z') indicates a goal
      return cell === '0' || /^[A-Z]$/.test(cell);
    })
  );

  if (!hasGoals) {
    alert("The goal state has no goals! Please add at least one goal (agent or box) before exporting.");
    return; // Exit the function to prevent file export
  }

  let levelname = prompt('Enter level name (will be saved as .lvl format):', 'CUSTOMLEVEL');

  // Blue and then count the number of agents in the map for colors
  let colors = 'blue: ' + 
    [
      ...Array.from({ length: initialAgentCounter }, (_, i) => i), // Generate agent numbers
      ...Array.from({ length: initialBoxCounter }, (_, i) => String.fromCharCode(65 + i)) // Generate box letters
    ].join(',');

  let initialState = mapData.map(row => row.join('')).join('\n');
  let goalState = goalMapData.map(row => row.join('')).join('\n');
  let mapText = 
  `#domain
hospital
#levelname
${levelname}
#colors
${colors}
#initial
${initialState}
#goal
${goalState}
#end`;

  // Create a Blob from the map text and trigger a download
  const blob = new Blob([mapText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${levelname}.lvl`;
  document.body.appendChild(a); // Append to the document
  a.click(); // Programmatically click the link to trigger download
  document.body.removeChild(a); // Remove the link after downloading
  URL.revokeObjectURL(url); // Clean up the URL object
});

// Initial grid setup
createGrid();

