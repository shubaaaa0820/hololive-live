const liveList = document.getElementById("live-list");

const DATA_URL = "data/streams.json";

async function loadStreams() {
    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error(
                `JSONの取得に失敗しました: ${response.status}`
            );
        }

        const data = await response.json();

        displayStreams(data.streams || []);

    } catch (error) {
        console.error(error);

        liveList.innerHTML = `
            <p class="error">
                配信情報を取得できませんでした。
            </p>
        `;
    }
}


function displayStreams(streams) {

    liveList.innerHTML = "";

    if (streams.length === 0) {
        liveList.innerHTML = `
            <p class="empty">
                現在、取得できる配信はありません。
            </p>
        `;

        return;
    }


    for (const stream of streams) {

        const card =
            document.createElement("div");

        card.className = "live-card";


        const statusText =
            getStatusText(stream.status);


        const startTime =
            formatDate(
                stream.scheduledStartTime ||
                stream.actualStartTime
            );


        card.innerHTML = `
            <img
                src="${escapeHtml(stream.thumbnail || "")}"
                alt="${escapeHtml(stream.name)}の配信サムネイル"
            >

            <div class="live-card-content">

                <div class="live-card-header">

                    <span class="branch">
                        ${escapeHtml(stream.branch || "")}
                    </span>

                    <span class="status status-${escapeHtml(stream.status)}">
                        ${statusText}
                    </span>

                </div>

                <h2>
                    ${escapeHtml(stream.name)}
                </h2>

                <h3>
                    ${escapeHtml(stream.title)}
                </h3>

                <p class="start-time">
                    ${startTime}
                </p>

                <a
                    href="${escapeHtml(stream.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    YouTubeで見る
                </a>

            </div>
        `;


        liveList.appendChild(card);
    }
}


function getStatusText(status) {

    switch (status) {

        case "live":
            return "配信中";

        case "upcoming":
            return "配信予定";

        case "ended":
            return "終了";

        default:
            return "不明";
    }
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "";
    }


    return date.toLocaleString(
        "ja-JP",
        {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


loadStreams();
