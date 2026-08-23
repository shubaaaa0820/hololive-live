const liveList = document.getElementById("live-list");

const DATA_URL = "data/streams.json";


/*
 * ================================================================
 * JSON取得
 * ================================================================
 */

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
 * 配信表示
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
     * 開始時刻順に並べる
     *
     * 同時刻の場合はJSONの元の順番を維持
     */

    const sortedStreams =
        streams
            .map((stream, index) => ({
                stream,
                index
            }))
            .sort((a, b) => {

                const timeA =
                    new Date(
                        getStartTime(a.stream)
                    ).getTime();

                const timeB =
                    new Date(
                        getStartTime(b.stream)
                    ).getTime();


                /*
                 * 日時が正常なら時刻順
                 */

                if (
                    !Number.isNaN(timeA) &&
                    !Number.isNaN(timeB)
                ) {

                    if (timeA !== timeB) {
                        return timeA - timeB;
                    }
                }


                /*
                 * 同時刻、または日時不明なら
                 * JSONの元の順番
                 */

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


        if (!groups.has(dateInfo.key)) {

            groups.set(
                dateInfo.key,
                {
                    label: dateInfo.label,
                    streams: []
                }
            );
        }


        groups
            .get(dateInfo.key)
            .streams
            .push(stream);
    }


    /*
     * ============================================================
     * 日付ごとに表示
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


        section.appendChild(
            heading
        );


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
 * 開始時刻取得
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
 * 日本時間の日付情報を取得
 *
 * 例：
 *
 * 2026-08-23T04:00:00Z
 *
 * ↓
 *
 * 2026年8月23日 13:00 JST
 *
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
     * 日本時間の各要素を取得
     */

    const year =
        Number(
            new Intl.DateTimeFormat(
                "ja-JP",
                {
                    timeZone: "Asia/Tokyo",
                    year: "numeric"
                }
            ).format(date)
        );


    const month =
        Number(
            new Intl.DateTimeFormat(
                "ja-JP",
                {
                    timeZone: "Asia/Tokyo",
                    month: "numeric"
                }
            ).format(date)
        );


    const day =
        Number(
            new Intl.DateTimeFormat(
                "ja-JP",
                {
                    timeZone: "Asia/Tokyo",
                    day: "numeric"
                }
            ).format(date)
        );


    const weekday =
        new Intl.DateTimeFormat(
            "ja-JP",
            {
                timeZone: "Asia/Tokyo",
                weekday: "short"
            }
        ).format(date);


    /*
     * グループ判定用
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
        String(value ?? "");

    return div.innerHTML;
}


/*
 * ================================================================
 * 実行
 * ================================================================
 */

loadStreams();
