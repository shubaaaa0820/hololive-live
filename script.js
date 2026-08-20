const liveList = document.getElementById("live-list");

const card = document.createElement("div");
card.className = "live-card";

card.innerHTML = `
    <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
         alt="配信サムネイル">

    <div class="live-card-content">
        <h2>JavaScript配信</h2>
        <p>JavaScriptから作りました</p>

        <a href="https://www.youtube.com/" target="_blank">
            YouTubeで見る
        </a>
    </div>
`;

liveList.appendChild(card);
