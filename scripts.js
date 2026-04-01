const Contests = new Map();
const Handles = new Set();
const ConType = new Set();

const TRASH_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trash-icon">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
</svg>`;

document.addEventListener('DOMContentLoaded', () => {
    updateContestList();

    const handleInp = document.getElementById("handleInp");
    if (handleInp) {
        handleInp.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                addHandle();
            }
        });
    }
});

async function updateContestList() {
    try {
        const response = await fetch('https://codeforces.com/api/contest.list');
        const data = await response.json();

        if (data.status === "OK") {
            data.result.forEach(contest => {
                if (contest.phase === "FINISHED") {
                    Contests.set(contest.id, contest.name);
                }
            });
        }
    } catch (error) {
        console.error("Error fetching contests:", error);
    }
}

async function addHandle() {
    const input = document.getElementById("handleInp");
    const handle = input.value.trim();

    if (!handle || Handles.has(handle)) return;

    try {
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const data = await response.json();

        if (data.status === "OK") {
            const user = data.result[0];
            const rating = user.rating || 0;
            const rank = user.rank || "unrated";

            Handles.add(handle);
            renderHandleRow(handle, rating, rank);
            input.value = "";
        } else {
            alert("Handle not found!");
        }
    } catch (error) {
        console.error("Error adding handle:", error);
        alert("Failed to fetch user info.");
    }
}

function renderHandleRow(handle, rating, rank) {
    const tbody = document.getElementById("handleBody");
    const row = document.createElement("tr");

    const ratingClass = getRatingClass(rating);

    row.innerHTML = `
        <td><span class="${ratingClass}" style="font-weight: 600">${handle}</span></td>
        <td><span class="${ratingClass}">${rating}</span></td>
        <td style="text-align: right">
            <button class="btn-icon" onclick="removeHandle('${handle}', this)" title="Remove">
                ${TRASH_ICON}
            </button>
        </td>
    `;

    tbody.appendChild(row);
}

function getRatingClass(rating) {
    if (rating < 1200) return "rating-noob";
    if (rating < 1400) return "rating-pupil";
    if (rating < 1600) return "rating-specialist";
    if (rating < 1900) return "rating-expert";
    if (rating < 2100) return "rating-cm";
    if (rating < 2300) return "rating-master";
    return "rating-gm";
}

function removeHandle(handle, btn) {
    const row = btn.closest("tr");
    Handles.delete(handle);
    row.remove();
}

function toggleFilter(id) {
    const btn = document.getElementById(id);
    if (ConType.has(id)) {
        ConType.delete(id);
        btn.classList.remove('btn-active');
        btn.classList.add('btn-outline');
    } else {
        ConType.add(id);
        btn.classList.add('btn-active');
        btn.classList.remove('btn-outline');
    }
}

async function showContests() {
    const contestBody = document.getElementById("contestBody");
    contestBody.innerHTML = '<tr><td colspan="2" style="text-align: center">Analyzing...</td></tr>';

    const attendedContests = new Set();
    const fetches = Array.from(Handles).map(handle =>
        fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "OK") {
                    data.result.forEach(sub => {
                        if (sub.verdict === "OK") {
                            attendedContests.add(sub.contestId);
                        }
                    });
                }
            })
    );

    try {
        await Promise.all(fetches);

        contestBody.innerHTML = "";
        let count = 0;

        const anytimeFilter = document.getElementById("anytimeFilter").checked;

        Contests.forEach((name, id) => {
            let match = true;
            if (ConType.size > 0) {
                match = Array.from(ConType).every(type => name.includes(type));
            }

            if (match && !attendedContests.has(id)) {
                const inAnytime = ANYTIME_CONTESTS.has(id);
                if (anytimeFilter && !inAnytime) return;

                const row = document.createElement("tr");
                if (inAnytime) row.classList.add("anytime-row");
                
                row.innerHTML = `
                    <td>
                        <a href="https://codeforces.com/contest/${id}" target="_blank" class="contest-link">${name}</a>
                    </td>
                    <td style="text-align: center;">
                        ${inAnytime ? '<span class="anytime-check">✓</span>' : ''}
                    </td>
                `;
                contestBody.appendChild(row);
                count++;
            }
        });

        if (count === 0) {
            contestBody.innerHTML = '<tr><td colspan="2" style="text-align: center">No contests found matching filters.</td></tr>';
        }
    } catch (error) {
        console.error("Error finding contests:", error);
        contestBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #ef4444">Error fetching data.</td></tr>';
    }
}