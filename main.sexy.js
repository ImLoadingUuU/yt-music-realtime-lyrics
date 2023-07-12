// ==UserScript==
// @name         YT Music Realtime Lyrics
// @version      0.1
// @description  If you stole my sexy code i phcu!!!
// @author       ImLoadingUuU (@0944_)
// @match        https://music.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @require https://cdn.jsdelivr.net/gh/lyswhut/lrc-file-parser@master/dist/lrc-file-parser.min.js
// ==/UserScript==
let nowLRC = undefined;
let lrcs = {
    prev: "",
    now: ""
}
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
function search(word) {
    return new Promise((resolve, reject) => {
        let searchXhr = new XMLHttpRequest()
        searchXhr.open("GET", `https://neteaseapi.imloadinguuu.repl.co/search?keywords=${encodeURI(word)}`)
        searchXhr.onload = () => {
            resolve(JSON.parse(searchXhr.responseText))
        }
        searchXhr.send();
    })
}
function updateLyricsContainerHTML(html) {
    let tabContainer = document.getElementById("tab-renderer")
    if (tabContainer.getAttribute("page-type") == "MUSIC_PAGE_TYPE_TRACK_LYRICS") {
        tabContainer.innerHTML = html
    } else {
        console.log("not in lyrics container or container doesn't exists")
    }
}
async function fetchLrc(word) {
    return new Promise(async (resolve) => {
        let lists = await search(word);
        if (!lists.result) {
            resolve(undefined)
        }
        let first = lists.result.songs[0]
        if (first) {
            let xhr = new XMLHttpRequest()
            xhr.open("GET", `https://neteaseapi.imloadinguuu.repl.co/lyric?id=${first.id}`)
            xhr.onload = () => {
                let parsed = JSON.parse(xhr.responseText)
                resolve(parsed.lrc.lyric);
            }
            xhr.send()
        }
    })

}
function timeout(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(time)
        }, time)
    })
}
function start() {
    let element = document.querySelector("html.no-focus-outline body ytmusic-app ytmusic-app-layout#layout.style-scope.ytmusic-app ytmusic-player-bar.style-scope.ytmusic-app div.middle-controls.style-scope.ytmusic-player-bar div.content-info-wrapper.style-scope.ytmusic-player-bar yt-formatted-string.title.style-scope.ytmusic-player-bar")
    let artistElement = document.querySelector("html.no-focus-outline body ytmusic-app ytmusic-app-layout#layout.style-scope.ytmusic-app ytmusic-player-bar.style-scope.ytmusic-app div.middle-controls.style-scope.ytmusic-player-bar div.content-info-wrapper.style-scope.ytmusic-player-bar span.byline-wrapper.style-scope.ytmusic-player-bar span.subtitle.style-scope.ytmusic-player-bar yt-formatted-string.byline.style-scope.ytmusic-player-bar.complex-string").children[0]
    // listen element change
    const observer = new MutationObserver(async function (mutationsList) {
        for (let mutation of mutationsList) {

            if (mutation.type === 'attributes' && mutation.attributeName === 'title') {

                let title = mutation.target.getAttribute("title")
                if (title) {
                    updateLyricsContainerHTML(`
                    <style>
                       .muted {
                        color:#6c757d;
                       }
                       .highlighted {
                        color:#007bff;
                        font-size: 48px;
                       }
                       
                    </style>
                    <div style="text-align: left; margin: 10px; margin-top: 50%;">
                    <h2 class="muted">None</h2>
                    <h1 class="highlighted">Lyrics</h1>
                    <h2 class="muted">Fetching...</h2>
                    </div>
                    `)
                    await timeout(1000)
                    console.log(`[FETCHING LRC] =======> ${title}`)
                  
                    if (nowLRC) {
                        console.log("OVERRIDE AND DELETE PREVIOUS LRC SESSION")
                        nowLRC.pause();
                    }
                    //
                    let lyric = await fetchLrc(`${title}`)

                    if (!lyric) {
                        console.log("[LRC NOT FOUND]")
                        updateLyricsContainerHTML(`
                        <style>
                           .muted {
                            color:#6c757d;
                           }
                           .highlighted {
                            color:#DC3545;
                            font-size: 48px;
                           }
                           
                        </style>
                        <div style="text-align: left; margin: 10px; margin-top: 50%;">
                        <h2 class="muted">Oops</h2>
                        <h1 class="highlighted">We don't have lyrics for</h1>
                        <h2 class="muted">this song</h2>
                        </div>
                        `)
                        return
                    }
                    console.log("=======[FETCHED LRC]=======")
                    console.log(lyric)
                    console.log("===============")

                    var lrcs = []

                    var lrc = new Lyric({
                        onPlay: function (line, text) { // Listening play event
                            console.log(line, text) // line is line number of current play
                            // text is lyric text of current play line
                            updateLyricsContainerHTML(`
                            <style>
                               .muted {
                                color:#6c757d;
                               }
                               .highlighted {
                                color:#007bff;
                                font-size: 48px;
                               }
                               
                            </style>
                            <div style="text-align: left; margin: 10px; margin-top: 50%;">
                            <h2 class="muted">${lrcs[line - 1] ? lrcs[line - 1].text : "..."}</h2>
                            <h1 class="highlighted">${text}</h1>
                            <h2 class="muted">${lrcs[line + 1] ? lrcs[line + 1].text : "..."}</h2>
                            </div>
                            `)
                        },
                        onSetLyric: function (lines) { // listening lyrics seting event
                            lrcs = lines
                        },
                        offset: 150, // offset time(ms), default is 150 ms
                        playbackRate: 1, // playback rate, default is 1
                        isRemoveBlankLine: true // is remove blank line, default is true
                    })
                    lrc.setLyric(lyric)
                    nowLRC = lrc;
                    console.log(`START LRC PLAYER AT ${document.querySelector("video").currentTime * 1000}`)
                    lrc.play(document.querySelector("video").currentTime * 1000)




                }

            }
        }
    });
    const config = { characterData: true, subtree: true };

    // 开始观察musicTitle元素的变化
    console.log("added listener")
    observer.observe(element, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
    });
}
// keep check elmenet exists until eixtst
var id = setInterval(() => {
    let element = document.querySelector("html.no-focus-outline body ytmusic-app ytmusic-app-layout#layout.style-scope.ytmusic-app ytmusic-player-bar.style-scope.ytmusic-app div.middle-controls.style-scope.ytmusic-player-bar div.content-info-wrapper.style-scope.ytmusic-player-bar yt-formatted-string.title.style-scope.ytmusic-player-bar")
    let artistElement = document.querySelector("html.no-focus-outline body ytmusic-app ytmusic-app-layout#layout.style-scope.ytmusic-app ytmusic-player-bar.style-scope.ytmusic-app div.middle-controls.style-scope.ytmusic-player-bar div.content-info-wrapper.style-scope.ytmusic-player-bar span.byline-wrapper.style-scope.ytmusic-player-bar span.subtitle.style-scope.ytmusic-player-bar yt-formatted-string.byline.style-scope.ytmusic-player-bar.complex-string a.yt-simple-endpoint.style-scope.yt-formatted-string")

    if (element && artistElement) {

        start();
        console.log("Element Founded")
        clearInterval(id);

    }
}, 100)
window.fetchLrc = fetchLrc;
