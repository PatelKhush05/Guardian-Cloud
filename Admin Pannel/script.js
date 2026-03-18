document.addEventListener('DOMContentLoaded', () => {

    async function debugAPI() {
        const url = "https://3ljmnqsxd0.execute-api.eu-north-1.amazonaws.com/prod/comments";
        try {
            const r = await fetch(url);
            const t = await r.text();
            console.log("🔍 RAW API RESPONSE:", t);
        } catch (e) {
            console.error("API not reachable:", e);
        }
    }
    debugAPI();


    // ===============================
    // THEME TOGGLE
    // ===============================
    const themeBtn = document.getElementById("theme-toggle");

    if(themeBtn){
        themeBtn.addEventListener("click", () => {

            const body = document.body;

            if(body.getAttribute("data-theme") === "dark"){
                body.setAttribute("data-theme","light");
            } else {
                body.setAttribute("data-theme","dark");
            }

        });
    }


    // ===============================
    // LIVE POLLING
    // ===============================
    loadLiveComments();
    setInterval(loadLiveComments, 5000);


    // ===============================
    // ADMIN ACTIONS
    // ===============================
    window.mitigate = (btn, action, user) => {

        const row = btn.closest('tr');

        if (action === 'hide') {
            row.remove();
        }

        if (action === 'ban') {
            row.style.opacity = "0.4";
            alert(`User @${user} added to blacklist (demo)`);
        }

    };


    // ===============================
    // UPDATE DASHBOARD STATS
    // ===============================
    function updateDashboard(comments, latency){

        const totalScans = comments.length;

        const blocked = comments.filter(c =>
            c.status === "BLOCKED" || c.status === "BANNED"
        ).length;

        const safe = comments.filter(c =>
            c.status === "SAFE"
        ).length;

        const systemHealth = totalScans > 0
            ? ((safe / totalScans) * 100).toFixed(1)
            : 100;

        document.getElementById("scan-count").innerText = totalScans;
        document.getElementById("block-count").innerText = blocked;
        document.getElementById("latency-value").innerText = latency + "ms";
        document.getElementById("health-value").innerText = systemHealth + "%";


        // ===============================
        // THREAT ANALYSIS
        // ===============================

        const phishing = comments.filter(c => c.threatType === "PHISHING").length;
        const spam = comments.filter(c => c.threatType === "SPAM").length;
        const toxic = comments.filter(c => c.threatType === "TOXIC").length;

        const totalThreats = phishing + spam + toxic || 1;

        const phishPercent = Math.round((phishing/totalThreats)*100);
        const spamPercent = Math.round((spam/totalThreats)*100);
        const toxicPercent = Math.round((toxic/totalThreats)*100);

        document.getElementById("phish-percent").innerText = phishPercent + "%";
        document.getElementById("spam-percent").innerText = spamPercent + "%";
        document.getElementById("toxic-percent").innerText = toxicPercent + "%";

        document.getElementById("phish-bar").style.width = phishPercent + "%";
        document.getElementById("spam-bar").style.width = spamPercent + "%";
        document.getElementById("toxic-bar").style.width = toxicPercent + "%";

    }


    // ===============================
    // LOAD LIVE COMMENTS
    // ===============================
    async function loadLiveComments() {

        const API_URL =
        "https://3ljmnqsxd0.execute-api.eu-north-1.amazonaws.com/prod/comments";

        const start = performance.now();

        try {

            const response = await fetch(API_URL);

            const latency = Math.round(performance.now() - start);

            const data = await response.json();

            console.log("API DATA:", data);

            let comments;

            if (data.body) {
                comments = JSON.parse(data.body);
            } else {
                comments = data;
            }


            // ===============================
            // SORT BY TIME
            // ===============================
            comments.sort((a,b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });


            // ===============================
            // UPDATE DASHBOARD
            // ===============================
            updateDashboard(comments, latency);


            const tbody = document.getElementById("log-body");
            tbody.innerHTML = "";

            comments.forEach(item => {

                const row = document.createElement("tr");

                row.innerHTML = `
                   <td class="mono">
                       ${new Date(item.timestamp).toLocaleTimeString()}
                   </td>

                   <td class="fw-bold">Social</td>

                   <td class="fw-bold">@${item.username}</td>

                    <td>
                        <span class="payload-neon">
                            "${item.commentText}"
                        </span>
                    </td>

                    <td>
                        <span class="badge-neon ${
                            item.status === "SAFE" ? "safe" : "phish"
                        }">
                            ${item.status}
                        </span>
                    </td>

                    <td class="text-center">
                        <button class="btn btn-outline-secondary btn-sm"
                            onclick="mitigate(this, 'hide', '${item.username}')">
                            Hide
                        </button>

                        <button class="btn btn-outline-danger btn-sm"
                            onclick="mitigate(this, 'ban', '${item.username}')">
                            Ban
                        </button>
                    </td>
                `;

                tbody.appendChild(row);

            });

        } catch (error) {
            console.error("❌ Failed to load comments:", error);
        }

    }

});