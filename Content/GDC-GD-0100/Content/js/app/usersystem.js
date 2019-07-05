var usHostLocation = "";
var usHostType = "web";
var usActCode = "";
var usUser = "";
var usUserID = "";
var usResumeLocation = {};
var usTeacher = 0x0;
var usSku = "";

var usSocket;
var usPendingNavigationLink = "";

function swap32(val) {
    return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
}

function USSocket_Opened(event)
{
    console.log("connected");
    USIdentify();
    if (usPendingNavigationLink && usPendingNavigationLink.length > 0) {
        USSendNavigation(usPendingNavigationLink);
        usPendingNavigationLink = "";
    }
}

function USSocket_Message(event)
{
    console.log("message: " + event.data);
    var fr = new FileReader();
    fr.onload = ProcessMessage;
    fr.readAsArrayBuffer(event.data);
}

function USSocket_Error(event)
{
    console.log("error");
}

function USSocket_Close(event)
{
    console.log("closed");
}

function UserSystem_Start()
{
    if (usHostLocation != null && usHostLocation.length > 0)
    {
        usSocket = new WebSocket(usHostLocation);
        usSocket.addEventListener("open", USSocket_Opened);
        usSocket.addEventListener("message", USSocket_Message);
        usSocket.addEventListener("error", USSocket_Error);
        usSocket.addEventListener("close", USSocket_Close);
    }

    if (window.location.search.length > 0)
    {
        var link = decodeURIComponent(window.location.search.substring(1, window.location.search.length));        
        var linkObj = JSON.parse(link);
        usResumeLocation = linkObj;
    }
}

function ProcessMessage()
{
    var data = new DataView(this.result, 0);

    var marker = data.getUint32(0);
    if (marker == 1195660627)
    {
        var packetType = data.getUint32(4);
        if (packetType == 251658240) // push command
        {
            var linkLen = swap32(data.getUint32(8));
            var link = "";
            for (var i = 0; i < linkLen; i++)
            {
                link += String.fromCharCode(data.getUint8(12 + i));
            }
            var offset = 12 + linkLen;

            var skuLen = swap32(data.getUint32(offset));
            offset += 4;
            var sku = "";
            for (var i = 0; i < skuLen; i++)
            {
                sku += String.fromCharCode(data.getUint8(offset + i));
            }

            console.log("push command: " + link + ", " + sku);
            if (sku != usSku)
                window.location = "../../" + sku + "/Content/index.html?" + link;
            else
            {
                var linkObj = JSON.parse(link);
                GoToPage(linkObj, angular.element(document.getElementById("play")).scope().theState);
            }
        }
        else
            console.log("packet of type: " + packetType);
    }
}

function USIdentify()
{
    var keyString = usTeacher.toString();
    var dataSize = 20 + keyString.length + usUserID.length;
    var ar = new ArrayBuffer(dataSize);
    var data = new DataView(ar, 0);
    data.setUint32(0, 1195660627);
    data.setUint32(4, swap32(16));
    data.setUint32(8, 0);
    data.setUint32(12, swap32(usUserID.length));

    var offset = 16;
    for (var i = 0; i < usUserID.length; i++)
        data.setUint8(offset + i, usUserID.charCodeAt(i));

    offset += usUserID.length;
    data.setUint32(offset, swap32(keyString.length));
    offset += 4;
    for (var i = 0; i < keyString.length; i++)
        data.setUint8(offset + i, keyString.charCodeAt(i));

    var blob = new Blob([ar], { type: "application/octet-binary" });
    usSocket.send(blob);
}

function USLogNavigation(link)
{
    console.log("USLogNavigation: " + link);
    
    if (usSocket && usSocket.readyState == 1)
        USSendNavigation(link);
    else
        usPendingNavigationLink = link;
}

function USSendNavigation(link)
{
    var dataSize = 16 + link.length + usSku.length;
    var ar = new ArrayBuffer(dataSize);
    var data = new DataView(ar, 0);
    data.setUint32(0, 1195660627);
    data.setUint32(4, swap32(2));
    data.setUint32(8, swap32(link.length));

    var offset = 12;
    for (var i = 0; i < link.length; i++)
        data.setUint8(offset + i, link.charCodeAt(i));

    offset += link.length;
    data.setUint32(offset, swap32(usSku.length));
    offset += 4;
    for (var i = 0; i < usSku.length; i++)
        data.setUint8(offset + i, usSku.charCodeAt(i));

    var blob = new Blob([ar], { type: "application/octet-binary" });
    usSocket.send(blob);
}

function USSubmitPush(link)
{
    var dataSize = 16 + link.length + usSku.length;
    var ar = new ArrayBuffer(dataSize);
    var data = new DataView(ar, 0);
    data.setUint32(0, 1195660627);
    data.setUint32(4, swap32(14));
    data.setUint32(8, swap32(link.length));

    var offset = 12;
    for (var i = 0; i < link.length; i++)
        data.setUint8(offset + i, link.charCodeAt(i));

    offset += link.length;
    data.setUInt32(offset, swap32(usSku.length));
    offset += 4;
    for (var i = 0; i < usSku.length; i++)
        data.setUint8(offset + i, usSku.charCodeAt(i));

    var blob = new Blob([ar], { type: "application/octet-binary" });
    usSocket.send(blob);
}

function USVideoComplete(videoId)
{
    var dataSize = 12 + videoId.length;
    var ar = new ArrayBuffer(dataSize);
    var data = new DataView(ar, 0);
    data.setUint32(0, 1195660627);
    data.setUint32(4, swap32(22));
    data.setUint32(8, swap32(videoId.length));

    var offset = 12;
    for (var i = 0; i < videoId.length; i++)
        data.setUint8(offset + i, videoId.charCodeAt(i));

    var blob = new Blob([ar], { type: "application/octet-binary" });
    usSocket.send(blob);
}
