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


/*
 * ================================================================
 * 全体表示
 * ================================================================
 */

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
     * 元のJSON順を保持したまま、
     * 開始時刻だけでソートする。
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

                if (timeA < timeB) {
                    return -1;
                }

                if (timeA > timeB) {
                    return 1;
                }

                return a.index - b.index;
            })
            .map(item => item.stream);


    /*
     * ============================================================
     * 日付ごとにグループ化
     * ============================================================
     */

    const groups = new Map();


    for (const stream of sortedStreams) {

        const dateInfo =
            getDateInfo(stream);


        const key =
            dateInfo.key;


        if (!groups.has(key)) {

            groups.set(
                key,
                {
                    label: dateInfo.label,
                    streams: []
                }
            );
        }


        groups
            .get(key)
            .streams
            .push(stream);
    }


    /*
     * ============================================================
     * 日付セクション生成
     * ============================================================
     */

    for (const group of groups.values()) {

        const section =
            document.createElement("section");

        section.className =
            "date-section";


        const heading =
            document.createElement("h2");

        heading.className =
            "date-heading";


        heading.textContent =
            group.label;


        section.appendChild(heading);


        const cards =
            document.createElement("div");

        cards.className =
            "date-streams";


        for (
            const stream
            of group.streams
        ) {

            cards.appendChild(
                createStreamCard(stream)
            );
        }


        section.appendChild(cards);

        liveList.appendChild(section);
    }
}


/*
 * ================================================================
 * 配信開始時刻
 * ================================================================
 */

function getStartTime(stream) {

    return (
        stream.scheduledStartTime ||
        stream.actualStartTime ||
        stream.publishedAt ||
        ""
    );
}


/*
 * ================================================================
 * 日付情報
 *
 * ここでは日付キーを文字列として扱い、
 * Dateオブジェクトを再度日付文字列へ変換しない。
 * ================================================================
 */

function getDateInfo(stream) {

    const value =
        getStartTime(stream);


    if (!value) {

        return {
            key: "unknown",
            label: "日時不明"
        };
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return {
            key: "unknown",
            label: "日時不明"
        };
    }


    /*
     * 日本時間
     */

    const formatter =
        new Intl.DateTimeFormat(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
                year: "numeric",
                month: "numeric",
                day: "numeric",
                weekday: "short"
            }
        );


    const parts =
        formatter.formatToParts(date);


    let year = "";
    let month = "";
    let day = "";
    let weekday = "";


    for (const part of parts) {

        if (part.type === "year") {
            year = part.value;
        }

        if (part.type === "month") {
            month = part.value;
        }

        if (part.type === "day") {
            day = part.value;
        }

        if (part.type === "weekday") {
            weekday = part.value;
        }
    }


    /*
     * 日付比較用キー
     */

    const key =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    /*
     * 表示用
     */

    const label =
        `${month}月${day}日（${weekday}）`;


    return {
        key,
        label
    };
}


/*
 * ================================================================
 * 配信カード
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


    const status =
        getStatusText(
            stream.status
        );


    const statusClass =
        `status-${
            stream.status || "unknown"
        }`;


    card.innerHTML = `

        <a
            class="thumbnail-link"
            href="${escapeHtml(stream.url)}"
            target="_blank"
            rel="noopener noreferrer"
        >

            <img
                src="${escapeHtml(
                    stream.thumbnail || ""
                )}"
                alt="${escapeHtml(
                    stream.name || ""
                )}の配信サムネイル"
            >

        </a>


        <div class="live-card-content">

            <div class="live-card-header">

                <span class="start-time">
                    ${escapeHtml(startTime)}
                </span>

                <span
                    class="status ${statusClass}"
                >
                    ${escapeHtml(status)}
                </span>

            </div>


            <h3 class="stream-name">
                ${escapeHtml(
                    stream.name || ""
                )}
            </h3>


            <p class="stream-title">
                ${escapeHtml(
                    stream.title || ""
                )}
            </p>

        </div>
    `;


    return card;
}


/*
 * ================================================================
 * 時刻表示
 * ================================================================
 */

function formatStartTime(value) {

    if (!value) {
        return "--:--";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--:--";
    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


/*
 * ================================================================
 * ステータス
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
        String(value ?? "");

    return div.innerHTML;
}


/*
 * ================================================================
 * 実行
 * ================================================================
 */

loadStreams();
