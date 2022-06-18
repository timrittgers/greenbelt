const playlistCallback = (resultJson) => {
    document.querySelector(".result").innerHTML = JSON.stringify(resultJson);
    resultJson.forEach((playlist) => {
        document.querySelector("#servicesList").insertAdjacentHTML('beforeend', `<li><button class="btn btn-link playlistButton" data-playlist-index="${playlist.id.index}">${playlist.id.name}</button></li>`);
    });

    document.querySelectorAll('.playlistButton').forEach((button) => {
        button.addEventListener("click", function (event) {
            loadService(event);
        });
    });
};

const getIP = () => {
    return document.querySelector("#serverIP").value
}

const getPort = () => {
    return document.querySelector("#serverPort").value
}

// load values from storage
const saveConnection = () => {
    let server = [];

    let fields = document.querySelectorAll(
        "#serverIP, #serverPort"
    );
    fields.forEach(function (element) {
        server.push({
            field: element.id,
            text: element.value
        });
    });
    console.log(server);
    localStorage.setItem("serverData", JSON.stringify(server));
};

const makeConnection = async () => {
    response = await fetch(`http://${getIP()}:${getPort()}/version`);
    json = await response.json();
    document.querySelector(".result").innerHTML = JSON.stringify(json);
    saveConnection();
}

const loadService = async (event) => {
    response = await fetch(`http://${getIP()}:${getPort()}/v1/playlist/${event.target.dataset.playlistIndex}`);
    json = await response.json();
    document.querySelector("#serviceName").innerHTML = json.id.name;
    document.querySelector("#itemsList").innerHTML = '';
    json.items.forEach((item) => {
        document.querySelector("#itemsList").insertAdjacentHTML('beforeend', `<li><button class="btn btn-link itemButton" data-playlist-index="${json.id.index}" data-item-index="${item.id.index}">${item.id.name}</button></li>`);
    });

    document.querySelectorAll('.itemButton').forEach((button) => {
        button.addEventListener("click", function (event) {
            loadItem(event);
        });
    });

    document.querySelector("#serviceView").classList.remove('d-none');
}

const loadItem = async (event) => {
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/trigger/playlist/${event.target.dataset.playlistIndex}/${event.target.dataset.itemIndex}/0`);
    let status = await response.status;
    document.querySelector(".result").innerHTML = JSON.stringify(status);
    setTimeout(loadSlideIndexInfo, 500);
}

const loadSlideIndexInfo = async () => {
    console.log('loadSlideIndexInfo');
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/presentation/current`);
    let json = await response.json();
    document.querySelector(".result").innerHTML = JSON.stringify(json);
    loadSlideImages(json);
}

const getSlideImage = async (myImage, presentationUuid, index) => {
    console.log('getSlideImage');
    let response = await fetch(`http://${getIP()}:${getPort()}/v1/presentation/${presentationUuid}/thumbnail/${index}?quality=800`);
    let blob = await response.blob();
    var objectURL = URL.createObjectURL(blob);
    myImage.src = objectURL;
}

const goToNext = async (event) => {
    console.log('event');
    const result = await fetch(`http://${getIP()}:${getPort()}/v1/trigger/cue/${event.target.dataset.index}`);
}

const generateSlides = async (resultJson, index) => {
    document.querySelector("#slideList").insertAdjacentHTML('beforeend', `<div class="col-4 mb-4"><img data-index="${index}" class="slideImage"></div>`);

    var myImage = document.querySelectorAll('.slideImage')[index];

    myImage.addEventListener('click', function(event) {
        goToNext(event);
        event.target.classList.add('active');
    });

    await getSlideImage(myImage, resultJson.presentation.id.uuid, index);
}

const loadSlideImages = async (resultJson) => {
    console.log('loadSlideImages');
    playlistLength = 0;
    resultJson.presentation.groups.forEach((group) => {
        group.slides.forEach((slide) => {
            playlistLength = playlistLength + 1;
        });
    })

    document.querySelector("#ItemName").innerHTML = resultJson.presentation.id.name;
    document.querySelector("#slideList").innerHTML = '';

    for(i=0; i<playlistLength; i++) {
        generateSlides(resultJson, i);
    }
}

// Get playlists
const getPlaylists = async () => {
    if (getIP() != '') {
        let response = await fetch(`http://${getIP()}:${getPort()}/v1/playlists`);
        let json = await response.json();
        playlistCallback(json);
    }
}

document.querySelector(".saveButton").addEventListener("click", saveConnection);
document.querySelector(".connectButton").addEventListener("click", makeConnection);
document.querySelector("#previousSlide").addEventListener("click", function() {
    fetch(`http://${getIP()}:${getPort()}/v1/trigger/previous`);
    document.querySelectorAll('.slideImage').forEach((slide) => {
        slide.classList.remove('active');
    });
});
document.querySelector("#nextSlide").addEventListener("click", function() {
    fetch(`http://${getIP()}:${getPort()}/v1/trigger/next`);
    document.querySelectorAll('.slideImage').forEach((slide) => {
        slide.classList.remove('active');
    });
});

// on page load, load saved values if they exist
let stored = JSON.parse(localStorage.getItem("serverData"));
if (stored) {
    console.log(stored);
    stored.forEach(function (item) {
        document
            .querySelector("#" + item.field).value = item.text;
    });
}

getPlaylists();