const $ = require("jquery");
const localStorage = require('electron-localstorage');
const fetch = require('node-fetch');
const videojs = require('video.js');
let pxe = ""
let jct = ""
let st = ""
let secversion = ""
let jToken = ""
let ssoLevel = ""
let ssoToken = ""
let subscriberId = ""
let unique = ""
let lbCookie = ""
let username = ""
let channles = []
let channle_id = 173

async function set_cdn_token() {
    let token_data = await (await fetch('https://tv.media.jio.com/apis/v1.3/cdntoken/get', {
        headers: {
            "User-Agent": "plaYtv/6.0.5 (Linux;Android 8.1.0) ExoPlayerLib/2.10.6",
            "uniqueId": unique,
            "ssotoken": ssoToken,
            "subscriberId": subscriberId,
            "deviceId": "6e84fe5c6ff4ebd2",
            "os": "android",
            "userId": username,
            "versionCode": "250",
            "osVersion": "8.1.0",
            "crmid": subscriberId,
            "devicetype": "phone",
            "lbcookie": lbCookie,
            "usergroup": "tvYR7NSNn7rymo3F",
            "appkey": "NzNiMDhlYzQyNjJm",
            "sso": ssoToken
        }
    })).json()

    jct = token_data.result.jct
    pxe = token_data.result.pxe
    secversion = token_data.result.secversion
    st = token_data.result.st
}

async function login() {
    let login_data = localStorage.getItem("login_data")

    if (login_data == "") {
        login_data = await (await fetch("http://api.jio.com/v2/users/me", {
            headers: {
                "Accept": "application/json",
                "x-consumption-device-name": "10or G",
                "x-device-type": "android",
                "x-device-name": "G",
                "app-name": "RJIL_JioTV",
                "x-android-id": "298F1E1D80E8EE7E"
            },
            mode: 'cors'
        })).json()
        jToken = login_data.jToken
        ssoLevel = login_data.ssoLevel
        ssoToken = login_data.ssoToken
        subscriberId = login_data.sessionAttributes.user.subscriberId
        unique = login_data.sessionAttributes.user.unique
        lbCookie = login_data.lbCookie
    } else {
        jToken = login_data.jToken
        ssoLevel = login_data.ssoLevel
        ssoToken = login_data.ssoToken
        subscriberId = login_data.subscriberId
        unique = login_data.unique
        lbCookie = login_data.lbCookie
    }


    login_data = await (await fetch('https://tv.media.jio.com/apis/v1.3/login/loginviasubid', {
        method: 'POST',
        headers: {
            "ssotoken": ssoToken,
            "lbcookie": "1",
            "subscriberId": subscriberId,
            "devicetype": "phone",
            "os": "android",
            "appkey": "NzNiMDhlYzQyNjJm",
            "deviceId": "6e84fe5c6ff4ebd2",
            "versionCode": "250",
            "osVersion": "8.1.0",
            "isott": "false",
            "languageId": "6",
            "userId": subscriberId,
            "sid": unique,
            "crmid": subscriberId,
            "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 8.1.0; G Build/OPM1.171019.019)"
        },
        body: `request=login_subscribe&subscriberId=${subscriberId}`
    })).json()

    ssoToken = login_data.ssoToken
    unique = login_data.uniqueid
    username = login_data.username

    login_data = { jToken, ssoLevel, ssoToken, subscriberId, unique, lbCookie, username }

    localStorage.setItem("login_data", login_data)
}

async function get_channels() {
    let channles_data = await (await fetch('http://jiotv.data.cdn.jio.com/apis/v1.3/getMobileChannelList/get/?langId=6&os=android&devicetype=phone&usergroup=tvYR7NSNn7rymo3F&version=6.0.0',
        {
            headers: {
                "usergroup": "tvYR7NSNn7rymo3F",
                "appkey": "l7xx938b6684ee9e4bbe8831a9a682b8e19f",
                "devicetype": "phone",
                "os": "Android",
                "deviceId": "298F1E1D80E8EE7E",
                "appversion": "239",
                "appversioncode": "6.0.0",
                "lbcookie": "1",
                "ua": "Linux"
            }
        }
    )).json()
    let i = 0;
    for (let channel of channles_data["result"]) {
        let channel_id = channel.channel_id
        let channel_name = channel.channel_name
        let logoUrl = channel.logoUrl
        $('#channels')
            .append($('<option>', { value: i })
                .text(channel_name));
        if (channel_id == 173) {
            $(`#channels option[value=${i}]`).attr('selected', 'selected');
        }
        i += 1;
        channles.push({ channel_id, channel_name, logoUrl })
    }

}


async function get_channel_m3u8(channel_id) {
    let m3u8_data = await (await fetch("http://tv.media.jio.com/apis/v1.4/getchannelurl/getchannelurl?langId=6", {
        method: 'post',
        headers: {
            "usergroup": "tvYR7NSNn7rymo3F",
            "appkey": "l7xx938b6684ee9e4bbe8831a9a682b8e19f",
            "devicetype": "phone",
            "os": "Android",
            "deviceId": "298F1E1D80E8EE7E",
            "appversion": "250",
            "appversioncode": "8.1.0",
            "lbcookie": "1",
            "ssotoken": ssoToken,
            "uniqueId": unique,
            "versionCode": "250",
            "languageId": "6",
            "osVersion": "8.1.0",
            "userId": username,
            "isott": "false"
        },
        body: `channel_id=${channel_id}&showtime=&stream_type=Seek`
    })).json()

    return m3u8_data["result"]
}


$(document).ready(async () => {


    await login()
    await get_channels()
    await set_cdn_token()
    setInterval(() => {
        set_cdn_token()
    }, 90000)

    let m3u8_url = await get_channel_m3u8(channle_id)
    let mediaSource = document.getElementsByTagName('source')[0];
    mediaSource.src = m3u8_url + `?jct=${jct}&pxe=${pxe}&st=${st}&secversion=${secversion}`

    var player = videojs('my-player');

    player.ready(function () {
        player.play();
    });

    player.on("loadstart", function (e) {
        player.hls.xhr.beforeRequest = function (options) {
            options.headers = {

                "uniqueId": unique,
                "ssotoken": ssoToken,
                "subscriberId": subscriberId,
                "deviceId": "6e84fe5c6ff4ebd2",
                "os": "android",
                "userId": username,
                "versionCode": "250",
                "osVersion": "8.1.0",
                "crmid": subscriberId,
                "channelid": channle_id,
                "srno": "123456",
                "devicetype": "phone",
                "lbcookie": lbCookie,
                "usergroup": "tvYR7NSNn7rymo3F",
                "appkey": "NzNiMDhlYzQyNjJm"
            }
            options.uri = options.uri + `?jct=${jct}&pxe=${pxe}&st=${st}&secversion=${secversion}`
        };
    });

    $('#channels').on('change', function (e) {


        channle_id = channles[this.value].channel_id;
        (async () => {
            let m3u8_url = await get_channel_m3u8(channle_id)
            player.src(m3u8_url + `?jct=${jct}&pxe=${pxe}&st=${st}&secversion=${secversion}`);
            player.play();
        })();

    });
});
