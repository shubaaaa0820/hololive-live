const liveList = document.getElementById("live-list");

const DATA_URL = "data/streams.json";


async function loadStreams() {

    try {

        const response =
            await fetch(DATA_URL);

        if (!response.ok) {

            throw new Error(
                `JSONの取得に失敗しました: ${response.status}`
            );
        }


        const data =
            await response.json();


        displayStreams(
            data.streams || []
        );


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


    /*
     * ------------------------------------------------------------
     * 配信開始時刻順に並べる
     *
     * 同じ時刻の場合は元のJSONの順番を維持する。
     * ------------------------------------------------------------
     */

    const sortedStreams =
        streams
            .map((stream, index) => ({
                stream,
                index
            }))
            .sort((a, b) => {

                const timeA =
                    getStartTime(a.stream);

                const timeB =
                    getStartTime(b.stream);


                const comparison =
                    timeA.localeCompare(timeB);


                if (comparison !== 0) {

                    return comparison;
                }


                /*
                 * 同時刻なら元のJSON順
                 */

                return a.index - b.index;
            })
            .map(item => item.stream);


    /*
     * ------------------------------------------------------------
     * 日付ごとにグループ化
     * ------------------------------------------------------------
     */

    const groups =
        new Map();


    for (
        const stream
        of sortedStreams
    ) {

        const date =
            getDateKey(stream);


        if (!groups.has(date)) {

            groups.set(
                date,
                []
            );
        }


        groups
            .get(date)
            .push(stream);
    }


    /*
     * ------------------------------------------------------------
     * 日付ごとに表示
     * ------------------------------------------------------------
     */

    for (
        const [date, dateStreams]
        of groups
    ) {

        const section =
            document.createElement("section");

        section.className =
            "date-section";


        const heading =
            document.createElement("h2");

        heading.className =
            "date-heading";

        heading.textContent =
            formatDateHeading(date);


        section.appendChild(
            heading
        );


        const cards =
            document.createElement("div");

        cards.className =
            "date-streams";


        for (
            const stream
            of dateStreams
        ) {

            cards.appendChild(
                createStreamCard(stream)
            );
        }


        section.appendChild(
            cards
        );

        liveList.appendChild(
            section
        );
    }
}


/*
 * ================================================================
 * 開始時刻取得
 * ================================================================
 */

function getStartTime(stream) {

    return (
        stream.scheduledStartTime ||
        stream.actualStartTime ||
        stream.publishedAt ||
        "9999-12-31T23:59:59Z"
    );
}


/*
 * ================================================================
 * 日付キー
 * ================================================================
 */

function getDateKey(stream) {

    const date =
        new Date(
            getStartTime(stream)
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "unknown";
    }


    /*
     * 日本時間の日付として扱う
     */

    const year =
        date.toLocaleString(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
                year: "numeric"
            }
        );

    const month =
        date.toLocaleString(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
                month: "2-digit"
            }
        );

    const day =
        date.toLocaleString(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
                day: "2-digit"
            }
        );


    return `${year}-${month}-${day}`;
}


/*
 * ================================================================
 * 日付見出し
 * ================================================================
 */

function formatDateHeading(dateKey) {

    if (dateKey === "unknown") {
        return "日時不明";
    }


    const parts =
        dateKey.split("-");


    if (parts.length !== 3) {
        return "日時不明";
    }


    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);


    if (
        !year ||
        !month ||
        !day
    ) {
        return "日時不明";
    }


    /*
     * 曜日だけを取得
     */

    const date =
        new Date(
            year,
            month - 1,
            day
        );


    const weekday =
        date.toLocaleDateString(
            "ja-JP",
            {
                weekday: "short"
            }
        );


    return `${month}月${day}日（${weekday}）`;
}


/*
 * ================================================================
 * 配信カード作成
 * ================================================================
 */

function createStreamCard(stream) {

    const card =
        document.createElement("article");

    card.className =
        "live-card";


    const startTime =
        formatStartTime(
            getStartTime(stream)
        );


    const statusText =
        getStatusText(
            stream.status
        );


    const statusClass =
        `status-${stream.status || "unknown"}`;


    card.innerHTML = `
        <a
            class="thumbnail-link"
            href="${escapeHtml(stream.url)}"
            target="_blank"
            rel="noopener noreferrer"
        >
            <img
                src="${escapeHtml(stream.thumbnail || "")}"
                alt="${escapeHtml(stream.name)}の配信サムネイル"
            >
        </a>

        <div class="live-card-content">

            <div class="live-card-header">

                <span class="start-time">
                    ${escapeHtml(startTime)}
                </span>

                <span class="status ${statusClass}">
                    ${escapeHtml(statusText)}
                </span>

            </div>

            <h3 class="stream-name">
                ${escapeHtml(stream.name)}
            </h3>

            <p class="stream-title">
                ${escapeHtml(stream.title)}
            </p>

        </div>
    `;


    return card;
}


/*
 * ================================================================
 * 開始時刻表示
 * ================================================================
 */

function formatStartTime(dateString) {

    if (!dateString) {

        return "--:--";
    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--:--";
    }


    return date.toLocaleTimeString(
        "ja-JP",
        {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/*
 * ================================================================
 * ステータス表示
 * ================================================================
 */

function getStatusText(status) {

    switch (status) {

        case "live":
            return "配信中";

        case "upcoming":
            return "予定";

        case "ended":
            return "終了";

        default:
            return "";
    }
}


/*
 * ================================================================
 * HTMLエスケープ
 * ================================================================
 */

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;
}


/*
 * ================================================================
 * 開始
 * ================================================================
 */

loadStreams();
