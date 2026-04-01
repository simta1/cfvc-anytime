// run on https://codeforces-anytime.firebaseapp.com/contests?page=1
(async () => {
    let allIds = new Set();
    let lastSize = -1;
    let lastPageNum = "";
    let stuckCount = 0;

    console.log("start...");

    while (true) {
        const rows = document.querySelectorAll("table tbody tr");
        rows.forEach(row => {
            const a = row.querySelector("td a");
            if (a && a.href.includes('contest/')) {
                const id = a.href.split('/').pop();
                allIds.add(parseInt(id));
            }
        });

        const currentPageNum = document.querySelector('a.item.active[type="pageItem"]')?.innerText;
        console.log(`current page: ${currentPageNum} | total ids: ${allIds.size}`);

        if (currentPageNum === lastPageNum && lastPageNum !== "") break;
        lastPageNum = currentPageNum;

        if (allIds.size === lastSize) if (++stuckCount >= 3) break;
        else stuckCount = 0;
        lastSize = allIds.size;

        const nextBtn = document.querySelector('a[type="nextItem"]');
        if (!nextBtn || nextBtn.classList.contains('disabled')) break;

        nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    const sortedIds = Array.from(allIds).sort((a, b) => b - a);
    window.anytimeData = sortedIds;

    const res = JSON.stringify(sortedIds);
    console.log(res);

    alert(`${sortedIds.length} contests collected!`);
})();