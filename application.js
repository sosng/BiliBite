var baseURL;

if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var MenuBar = {
  createNew: function(menuItems) {
    // menuItems : [{'title': title, 'params': {'param1': value1, 'param2', value2}}, {'title': title2, ...}]
    var menuBar = {};
    menuBar.menuItems = menuItems;
    menuBar.getXMLString = function() {
      var XMLString = '<document><menuBarTemplate><menuBar>';
      for (var i=0, len = menuBar.menuItems.length; i<len; i++) {
        var menuItem = menuBar.menuItems[i];
        // menuItem is a dict
        title = menuItem['title'];
        params = menuItem['params'];
        // params is a dict
        var menuItemXML = '<menuItem';
        for (var paramKey in params) {
          if (params.hasOwnProperty (paramKey)) {
            menuItemXML += ' ' + paramKey + '="' + params[paramKey] + '"';
          }
        }
        menuItemXML += '>';
        menuItemXML += '<title>' + title + '</title>';
        menuItemXML += '</menuItem>'
        XMLString += menuItemXML;
      }
      XMLString += '</menuBar></menuBarTemplate></document>';
      return XMLString;
    }
    return menuBar;
  }
}

var BangumiBundle = {
  createNew: function(seasonID) {
    var APIURL = "https://www.biliplus.com/api/bangumi?season=" + seasonID;
    var request = new XMLHttpRequest;
    request.open('GET', APIURL, false);
    request.send();
    var info = JSON.parse(request.response);

    var bangumiBundle = {};

    var episodes = info['result']['episodes'];
    bangumiBundle.seasonID = seasonID;
    bangumiBundle.info = info['result'];
    bangumiBundle.isSuccess = info['message'] == 'success';
    bangumiBundle.title = bangumiBundle.info['title'];
    bangumiBundle.original_name = bangumiBundle.info['origin_name'];
    bangumiBundle.cover = bangumiBundle.info['cover'];
    bangumiBundle.episodes = bangumiBundle.info['episodes'];
    bangumiBundle.description = bangumiBundle.info['evaluate'];
    bangumiBundle.count = bangumiBundle.episodes.length + ' Episodes';
    bangumiBundle.playCount = bangumiBundle.info['play_count'] + ' Hits';
      bangumiBundle.staff = bangumiBundle.info['staff'];

    bangumiBundle.getAVVideoObjects = function () {
      var avVideoObjects = [];
      for (var i=0, len=episodes.length; i < len; i++) {
        var avVideoObject = AVVideo.createNew(episodes[i]['av_id']);
        avVideoObjects.push(avVideoObject);
      }
      return avVideoObjects;
    }

    bangumiBundle.getXMLString = function() {
      var XMLString = '<document><productBundleTemplate><background></background><banner><stack><title>' + bangumiBundle.title + '</title><subtitle>' + bangumiBundle.original_name + '</subtitle><row>';
      for (var i=0, length = bangumiBundle.info['tags'].length; i < length; i++) {
        var tag = bangumiBundle.info['tags'][i];
        var tagName = tag['tag_name'];
        var tagXMLLine = '<text>' + tagName + '</text>';
        XMLString += tagXMLLine;
      }
      XMLString += '</row><description allowsZooming="true">' + bangumiBundle.description + '</description>';
      XMLString += '</stack><heroImg src="' + bangumiBundle.cover + '" /></banner><shelf>';
      XMLString += '<header><title>' + bangumiBundle.count + '</title></header><section>';
      for (var i=0, length = bangumiBundle.episodes.length; i < length; i++) {
        var episode = bangumiBundle.episodes[i];
        episodeXMLString = '<lockup av="' + episode['av_id'] + '">';
        episodeXMLString += '<img src="' + episode['cover'] + '" width="495" height="309" />';
        episodeXMLString += '<title>' + episode['index_title'] + '</title>';
        episodeXMLString += '</lockup>';
        XMLString += episodeXMLString;
      }
      XMLString += '</section></shelf><shelf><header><title>Staff</title></header><section>';
      var staffXML = '';
      var staffs = bangumiBundle.staff.trim().split("\n");
      for (var i = 0, len = staffs.length; i < len; i++) {
        var staff = staffs[i];
        var staffArray = staff.split('：');
        var staffTitle = staffArray[0];
        var staffNames = staffArray[1].split('、');
        for (var j=0, staffLen = staffNames.length; j < staffLen; j ++) {
          staffXML += '<monogramLockup>';
          var staffName = staffNames[j];
          staffXML += '<monogram firstName="' + staffName +'" lastName="" />';
          staffXML += '<title>' + staffName + '</title>';
          staffXML += '<subtitle>' + staffTitle + '</subtitle>';
          staffXML += '</monogramLockup>';
        }
      }
      XMLString += staffXML;
      XMLString += '</section></shelf></productBundleTemplate></document>';
      return XMLString;
    }
    return bangumiBundle;
  }
}

var AVVideo = {
  createNew: function(avID) {
    var APIURL = "https://www.biliplus.com/api/view?id=" + avID;
    var request = new XMLHttpRequest;
    request.open('GET', APIURL, false);
    request.send();
    var info = JSON.parse(request.response);

    var videoCount = info['list'].length;

    var avVideo = {};
    avVideo.avID = avID;
    avVideo.info = info;
    avVideo.title = info['title'];
    avVideo.cover = info['pic'];
    avVideo.author = info['author'];
    avVideo.videoList = info['list'];
    avVideo.description = info['description']

    avVideo.getSingleVideoObjects = function() {
      var singleVideoObjects = [];
      for (var i=0, len=videoCount; i < len; i++) {
        var name = info['list'][i]['part'];
        var page = info['list'][i]['page'];
        var singleVideoObject = SingleVideo.createNew(avID, page);
        singleVideoObjects.push(singleVideoObject);
      }
      return singleVideoObjects;
    }
    avVideo.getXMLString = function() {
      var XMLCoverPicLine = '<img src="' + avVideo.cover +'" />';
      var XMLString = '<document><compilationTemplate><list><relatedContent><itemBanner>';
      XMLString += '<heroImg src="' + avVideo.cover + '" /></itemBanner></relatedContent>';
      XMLString += '<header><title>' + avVideo.title + '</title><subtitle>' + avVideo.author + '</subtitle></header>';
      XMLString += '<section><description>' + avVideo.description + '</description></section><section>';
      for (var i=0, len=avVideo.videoList.length; i < len; i++) {
          var videoDict = avVideo.videoList[i];
          var videoName = videoDict["part"];
          var videoPage = videoDict["page"];
          var listItemLockupString = '<listItemLockup av="' + avVideo.avID + '" page="' + videoPage + '" name="' + videoName + '"><title>' + videoName + '</title><relatedContent><lockup>' + XMLCoverPicLine + '</lockup></relatedContent></listItemLockup>';
          XMLString = XMLString + listItemLockupString;
      }
      XMLString += '</section></list></compilationTemplate></document>';
      return XMLString;
    }
    return avVideo;
  }
}

var SingleVideo = {
  createNew: function(avID, page) {
    var APIURL = "https://www.biliplus.com/api/geturl?update=1&av=" + avID + "&page=" + page;
    var request = new XMLHttpRequest;
    request.open('GET', APIURL, false);
    request.send();
    var info = JSON.parse(request.response)['data'];

    var singleVideo = {};
    singleVideo.avID = avID;
    singleVideo.page = page;
    singleVideo.videoList = info;

    singleVideo.getSingleVideoURL = function() {
      var singleVideoURLList = [];
      for (var i=0, len=info.length; i < len; i++) {
        if (info[i]['type'] == 'single') {
          singleVideoURLList.push(info[i]);
        }
      }
      return singleVideoURLList;
    }

    singleVideo.getXMLString = function(videoTitle) {
      var XMLTitleLine = "<title>" + videoTitle + "</title>";
      var XMLHeader = "<document><listTemplate><banner>" + XMLTitleLine + "</banner><list><section>";
      var XMLString = XMLHeader;
      for (var i=0, len=singleVideo.videoList.length; i < len; i++) {
        var videoDict = singleVideo.videoList[i];
        if (videoDict['type'] == 'single') {
          var videoName = videoDict["name"];
          var videoURL = videoDict["url"];
          var listItemLockupString = '<listItemLockup onselect="playMedia(\'' + videoURL.replace(new RegExp('&', 'g'), '&amp;') + '\', \'video\')"><title>' + videoName + '</title></listItemLockup>';
          XMLString = XMLString + listItemLockupString;
        }
      }
      var XMLFooterString = "</section></list></listTemplate></document>";
      XMLString = XMLString + XMLFooterString;
      return XMLString;
    }
    return singleVideo;
  }
}

var TagList = {
  thisSeasonTagID: '167',
  createNew: function(tagID) {
    if (!tagID) {
      var APIURL = 'https://bangumi.bilibili.com/api/get_season_by_tag_v2?tag_id=' + TagList.thisSeasonTagID;
    } else {
      var APIURL = 'https://bangumi.bilibili.com/api/get_season_by_tag_v2?tag_id=' + tagID;
    }
    var request = new XMLHttpRequest;
    request.open('GET', APIURL, false);
    request.send();

    var tagList = {};
    tagList.info = JSON.parse(request.response)['result'];
    tagList.tagName = tagList.info['info']['tag_name'];
    tagList.list = tagList.info['list'];

    tagList.getXMLString = function() {
      var XMLString = '<document><paradeTemplate><list><header>';
      XMLString += '<title>' + tagList.tagName + '</title>';
      XMLString += '</header><section>';
      var imgDeckXML = '';
      for (var i=0, len = tagList.list.length; i < len; i++) {
        var videoDict = tagList.list[i];
        videoTitle = videoDict['title'];
        videoCover = videoDict['cover'];
        seasonID = videoDict['season_id'];
        XMLString += '<listItemLockup sid="' + seasonID + '"><title>' + videoTitle + '</title></listItemLockup>';
        imgDeckXML += '<img src="' + videoCover + '" />';
      }
      XMLString += '</section><relatedContent><imgDeck>' + imgDeckXML + '</imgDeck></relatedContent></list></paradeTemplate></document>';
      return XMLString;
    }
    return tagList;
  }
}



function loadingTemplate() {
    var loadingDoc = "<document><loadingTemplate><activityIndicator><text>Loading Page</text></activityIndicator></loadingTemplate></document>";
    return loadingDoc;
}

function getDocumentObjectFromXMLString(XMLString) {
    var parser = new DOMParser();
    var parsed = parser.parseFromString(XMLString, "application/xml");
    return parsed;
}

function alertTemplate() {
    var alertDoc = "<document><alertTemplate><title>Error</title><description>Page failed to load</description></alertTemplate></document>";
    return alertDoc;
}

function loadAndPushDocument(object) {
  var loadingDocument = getDocumentObjectFromXMLString(loadingTemplate());
  navigationDocument.pushDocument(loadingDocument);
  var XMLString = object.getXMLString();
  var document = getDocumentObjectFromXMLString(XMLString);
  document.addEventListener("select", handleSelectEvent);
  navigationDocument.replaceDocument(document, loadingDocument);
}

function pushDocumentFromDocumentObject(newDocument) {
    newDocument.addEventListener("select", handleSelectEvent);
    navigationDocument.pushDocument(newDocument);
}

function updateMenuItem(menuItem, url) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);

    request.onreadystatechange = function() {
        if (request.status == 200) {
            var document = request.responseXML;
            document.addEventListener("select", handleSelectEvent);
            var menuItemDocument = menuItem.parentNode.getFeature("MenuBarDocument");
            menuItemDocument.setDocument(document, menuItem);
        }
    };

    request.send();
}

function updateMenuItemFromDocumentObject(menuItem, DOM) {
    DOM.addEventListener("select", handleSelectEvent);
    var menuItemDocument = menuItem.parentNode.getFeature("MenuBarDocument");
    menuItemDocument.setDocument(DOM, menuItem);
}

function handleSelectEvent(event) {
    var selectedElement = event.target;

    var targetURL = selectedElement.getAttribute("selectTargetURL");
    var avNumber = selectedElement.getAttribute("av");
    var seasonID = selectedElement.getAttribute("sid");
    var page = selectedElement.getAttribute("page");
    var coverPage = selectedElement.getAttribute("coverPage");

    if (!targetURL && !avNumber && !seasonID && !coverPage) {
        return;
    }
    targetURL = baseURL + targetURL;

    if (seasonID) {
        var bangumiBundle = BangumiBundle.createNew(seasonID);
        var document = getDocumentObjectFromXMLString(bangumiBundle.getXMLString());
        if (selectedElement.tagName == 'menuItem') {
          updateMenuItemFromDocumentObject(selectedElement, document);
        } else {
          pushDocumentFromDocumentObject(document);
        }
    } else if (selectedElement.tagName == 'listItemLockup' && avNumber && page) {
        var singleVideo = SingleVideo.createNew(avNumber, page);
        var document = getDocumentObjectFromXMLString(singleVideo.getXMLString(selectedElement.getAttribute("name")));
        pushDocumentFromDocumentObject(document);
    } else if (selectedElement.tagName == "lockup" && avNumber){
        var avVideo = AVVideo.createNew(avNumber);
        var document = getDocumentObjectFromXMLString(avVideo.getXMLString());
        pushDocumentFromDocumentObject(document);
    } else if (selectedElement.tagName == "menuItem" && coverPage=='true') {
        var tagParade = TagList.createNew();
        var XMLString = tagParade.getXMLString();
        var document = getDocumentObjectFromXMLString(XMLString);
        updateMenuItemFromDocumentObject(selectedElement, document);
    } else if (selectedElement.tagName == "menuItem"){
          updateMenuItem(selectedElement, targetURL);
    } else {
        navigationDocument.pushDocument(getDocumentObjectFromXMLString(alertTemplate));
    }
}

function getStringFromURL(url) {
    var request = new XMLHttpRequest;
    request.open("GET", url, false);
    request.send();
    return request.response;
}

function playMedia(videoURL, mediaType) {
//    var singleVideo = new MediaItem(mediaType, videourl);
//    var videoList = new Playlist();
//    videoList.push(singleVideo);
//    var myPlayer = new Player();
//    myPlayer.playlist = videoList;
//    myPlayer.play();
    var headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36", "referer": "http://www.bilibili.com/video/av12328751"};
    playVideoWithModifiedHTTPHeader(videoURL, headers);
}

App.onLaunch = function(options) {
    var menuBar = MenuBar.createNew([{'title': 'Season\'s New', 'params': {'coverPage': 'true'}}]);
    loadAndPushDocument(menuBar);
  }