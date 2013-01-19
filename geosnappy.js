// GeoSnappy - An experimental JavaScript library for taking webcam pics together with geolocation coordinates

var GeoSnappy = function(videoSelector, canvasSelector) {
  var that = {};
  
  var canvasSel = canvasSelector;
  
  var video     = document.querySelector(videoSelector),
      canvas    = document.querySelector(canvasSel),
      width     = 320
      height    = 0,
      streaming = false;
  
  navigator.getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
  
  navigator.getMedia(
    { video: true, audio: false },
    function(stream) {
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL.createObjectURL(stream);
      }
      video.play();
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );
  
  var data = {
    coords: null,
    photo: null
  };
  
  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth / width);
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);
  
  that.getCoords = function() {
    navigator.geolocation.getCurrentPosition(function(position){
      data.coords = position.coords;
      document.getElementById('coords').value = data.coords.latitude + ', ' + data.coords.longitude;
    });
  };
  
  that.snap = function(callback, show){
    that.getCoords();
    
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    if (!!show) {
      canvas.style.display = 'block';
    }
    data.photo = canvas.toDataURL('image/jpeg');
    
    callback(data);
  };
  
  that.switchCanvas = function(newCanvas) {
    canvasSel = newCanvas;
    canvas = document.querySelector(canvasSel);
  };
  
  that.getCoords();
  
  return that;
};
