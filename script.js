const GITHUB_USERNAME = "fewgshjdkflgjh"; // Replace with your GitHub username
const REPO_NAME = "Earth"; // Replace with your repo name
const FILE_PATH = "roads.json";
const ACCESS_TOKEN = "your-github-access-token"; // Replace with your token

const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;

async function fetchRoads(bounds) {
    const key = `roads_${bounds.toBBoxString()}`;

    // Load roads from GitHub
    const cachedData = await loadRoadsFromGitHub();
    if (cachedData[key]) {
        console.log("Loading roads from GitHub:", key);
        drawRoads(cachedData[key]);
        return;
    }

    console.log("Fetching new roads:", key);

    const query = `[out:json];way[highway](${bounds.toBBoxString()});out geom;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Save to GitHub
        saveRoadsToGitHub(key, data);

        drawRoads(data);
    } catch (error) {
        console.error("Error fetching roads:", error);
    }
}

// Load roads from GitHub
async function loadRoadsFromGitHub() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: { Authorization: `token ${ACCESS_TOKEN}` }
        });

        if (!response.ok) throw new Error("Failed to fetch roads.json");

        const fileData = await response.json();
        const decodedContent = atob(fileData.content);
        return JSON.parse(decodedContent);
    } catch {
        return {};
    }
}

// Save roads to GitHub
async function saveRoadsToGitHub(key, data) {
    const savedData = await loadRoadsFromGitHub();
    savedData[key] = data;

    // Get file SHA (required for GitHub commits)
    const response = await fetch(GITHUB_API_URL, {
        headers: { Authorization: `token ${ACCESS_TOKEN}` }
    });

    const fileData = await response.json();
    const sha = fileData.sha;

    const commitData = {
        message: "Updated roads data",
        content: btoa(JSON.stringify(savedData, null, 2)),
        sha
    };

    fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
            Authorization: `token ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(commitData)
    })
        .then(response => response.json())
        .then(data => console.log("Roads saved to GitHub:", data))
        .catch(error => console.error("Error saving to GitHub:", error));
}
