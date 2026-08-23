const liveList = document.getElementById("live-list");

const DATA_URL = "data/streams.json";


/*
 * ================================================================
 * JSON取得
 * ================================================================
 */

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
     * ------------------------------------------------------------
     * 配信開始時刻順に並べる
     *
     * 同じ時刻の場合はJSONの順番を維持する。
     * ------------------------------------------------------------
     */

    const sortedStreams =
        streams
            .map(
                (stream, index) => ({
                    stream,
                    index
                })
            )
            .sort(
                (a, b) => {

                    const timeA =
                        getStartTime(
                            a.stream
                        );

                    const timeB =
                        getStartTime(
                            b.stream
                        );


                    const comparison =
                        timeA.localeCompare(
                            timeB
                        );


                    if (
                        comparison !== 0
                    ) {

                        return comparison;
                    }


                    /*
                     * 同時刻ならJSONの元の順番
                     */

                    return (
                        a.index -
                        b.index
                    );
                }
            )
            .map(
                item =>
                    item.stream
            );


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

        const dateKey =
            getDateKey(stream);


        if (
            !groups.has(dateKey)
        ) {

            groups.set(
                dateKey,
                []
            );
        }


        groups
            .get(dateKey)
            .push(stream);
    }


    /*
     * ------------------------------------------------------------
     * 日付ごとに表示
     * ------------------------------------------------------------
     */

    for (
        const [
            dateKey,
            dateStreams
        ]
        of groups
    ) {

        const section =
            document.createElement(
                "section"
            );


        section.className =
            "date-section";


        /*
         * 日付見出し
         */

        const heading =
            document.createElement(
                "h2"
            );


        heading.className =
            "date-heading";


        heading.textContent =
            formatDateHeading(
                dateKey
            );


        section.appendChild(
            heading
        );


        /*
         * その日の配信
         */

        const cards =
            document.createElement(
                "div"
            );


        cards.className =
            "date-streams";


        for (
            const stream
            of dateStreams
        ) {

            cards.appendChild(
                createStreamCard(
                    stream
                )
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
 * 開始時刻
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
 *
 * 日本時間の日付を
 *
 * 2026/08/24
 *
 * の形式で作る。
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


    return date.toLocaleDateString(
        "ja-JP",
        {
            timeZone:
                "Asia/Tokyo",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    );
}


/*
 * ================================================================
 * 日付見出し
 * ================================================================
 */

function formatDateHeading(dateKey) {

    if (
        dateKey === "unknown"
    ) {

        return "日時不明";
    }


    /*
     * dateKeyは
     *
     * 2026/08/24
     *
     * の形式
     */

    const parts =
        dateKey.split("/");


    if (
        parts.length !== 3
    ) {

        return dateKey;
    }


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        );


    const day =
        Number(
            parts[2]
        );


    if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day)
    ) {

        return dateKey;
    }


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
                weekday:
                    "short"
            }
        );


    return `${month}月${day}日（${weekday}）`;
}


/*
 * ================================================================
 * 配信カード
 * ================================================================
 */

function createStreamCard(stream) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "live-card";


    /*
     * 開始時刻
     */

    const startTime =
        formatStartTime(
            getStartTime(stream)
        );


    /*
     * 配信状態
     */

    const statusText =
        getStatusText(
            stream.status
        );


    const statusClass =
        `status-${
            stream.status ||
            "unknown"
        }`;


    /*
     * カードHTML
     */

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
                    stream.name
                )}の配信サムネイル"
            >

        </a>


        <div class="live-card-content">


            <div class="live-card-header">

                <span class="start-time">

                    ${escapeHtml(
                        startTime
                    )}

                </span>


                <span
                    class="status ${statusClass}"
                >

                    ${escapeHtml(
                        statusText
                    )}

                </span>

            </div>


            <h3 class="stream-name">

                ${escapeHtml(
                    stream.name
                )}

            </h3>


            <p class="stream-title">

                ${escapeHtml(
                    stream.title
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

function formatStartTime(
    dateString
) {

    if (
        !dateString
    ) {

        return "--:--";
    }


    const date =
        new Date(
            dateString
        );


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
            timeZone:
                "Asia/Tokyo",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


/*
 * ================================================================
 * ステータス表示
 * ================================================================
 */

function getStatusText(
    status
) {

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
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;
}


/*
 * ================================================================
 * 実行
 * ================================================================
 */

loadStreams();
