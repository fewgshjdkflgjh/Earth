(function() {
    const ACCESS_TOKEN = "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"; // Replace with your token
    const GITHUB_API_URL = `https://api.github.com/repos/fewgshjdkflgjh/Earth/contents/roads.json`;

    // Fetch roads from Overpass API and save/load from GitHub
    async function fetchRoads(bounds) {
        const key = `roads_${bounds.toBBoxString()}`;

        // Load roads from GitHub
        const cachedData = await loadRoadsFromGitHub();
        console.log("Cached Data:", cachedData); // Debugging log to see what is cached
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
            console.log("Overpass API Response:", data); // Debugging log to view Overpass API response

            if (!data.elements || data.elements.length === 0) {
                console.log("No road data found from Overpass API.");
                return;
            }

            // Save to GitHub
            saveRoadsToGitHub(key, data);

            drawRoads(data);
        } catch (error) {
            console.error("Error fetching roads from Overpass API:", error);
        }
    }

    // Load roads from GitHub
    async function loadRoadsFromGitHub() {
        try {
            const response = await fetch(GITHUB_API_URL, {
                headers: { Authorization: `token ${ACCESS_TOKEN}` }
            });

            if (!response.ok) {
                console.error("Failed to fetch roads.json. Status:", response.status);
                throw new Error("Failed to fetch roads.json");
            }

            const fileData = await response.json();
            console.log("GitHub API Response:", fileData); // Debugging log to see the raw GitHub response

            if (!fileData.content) {
                console.log("No content found in roads.json"); // Handle empty content
                return {}; // Return empty object if there's no content
            }

            // Decode Base64 content from GitHub
            const decodedContent = atob(fileData.content); // Decode the Base64 string
            console.log("Decoded Content:", decodedContent); // Debugging log to see the decoded content

            return JSON.parse(decodedContent); // Parse the JSON data
        } catch (error) {
            console.error("Error loading roads from GitHub:", error);
            return {}; // Return empty object if there is an error
        }
    }

    // Save roads to GitHub
    async function saveRoadsToGitHub(key, data) {
        const savedData = await loadRoadsFromGitHub(); // Load existing roads data
        console.log("Existing saved data:", savedData); // Debugging log to see existing saved data
        savedData[key] = data; // Add new data

        // Get file SHA (required for GitHub commits)
        const response = await fetch(GITHUB_API_URL, {
            headers: { Authorization: `token ${ACCESS_TOKEN}` }
        });

        const fileData = await response.json();
        console.log("File Data from GitHub:", fileData); // Debugging log to see GitHub file data

        if (!fileData.sha) {
            console.log("No SHA found in the file data. This might be a new file.");
        }

        const sha = fileData.sha; // Get the SHA of the file

        const commitData = {
            message: "Updated roads data", // Commit message
            content: btoa(JSON.stringify(savedData, null, 2)), // Base64 encode the updated data
            sha // Provide the file SHA to update the existing file
        };

        // Update the file on GitHub
        fetch(GITHUB_API_URL, {
            method: "PUT", // PUT method to update the file
            headers: {
                Authorization: `token ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(commitData) // Send the commit data
        })
            .then(response => response.json())
            .then(data => console.log("Roads saved to GitHub:", data))
            .catch(error => console.error("Error saving to GitHub:", error));
    }

    // Debugging: Simple function to "draw" roads on the map (use actual map drawing logic here)
    function drawRoads(data) {
        console.log("Drawing roads:", data); // Debugging log to see the data being drawn

        if (Array.isArray(data.elements)) {
            data.elements.forEach(element => {
                console.log("Road element:", element); // Debugging log for each road element
                // Implement your logic to display roads on a map
            });
        } else {
            console.error("Invalid data format for drawing roads");
        }
    }
})();
