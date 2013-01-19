var rmsStressTest = function(){};
var runUpload = function(){};

(function($) {

$(document).ready(function() {



var Purikura = function(video, canvases, matrix) {
  
  var videoSelector = video;
  var canvasSelectors = canvases;
  var current = 0;
  
  var GS = null;
  
  var imgUp = new Shov3({
    bucket:       'my-bucket',
    acl:          'public-read',
    redirect:     'http://example.com/done',
    contentType:  'image/jpeg',
    folder:       'purikura/',
    aws_key:      '==ADD_YOUR_AWS_KEY==',
    secret:       '==ADD_YOUR_AWS_SECRET=='
  }, jQuery);
  
  var that = {};
  
  that.showPics = function(){
    imgUp.listDir(function(results){
      $(results).find('Contents').each(function(){
        var imgUrl = 'http://my-bucket.s3.amazonaws.com/' + $(this).find('Key').text();
        var id = $(this).find('ETag').text().replace(/"/g, '');
        
        if ($('#' + id, '#crap').length == 0) {
          $('<img />', {
            id: id,
            src: imgUrl,
            style: 'max-width: 200px; display: inline-block; vertical-align: top; '
          }).prependTo('#crap');
        }
      });
    });
  };
  
  that.complete = function() {
    
    var compiledCanvas = $('<canvas />')[0];
    compiledCanvas.width = $(canvasSelectors[0]).width() * matrix[0];
    compiledCanvas.height = $(canvasSelectors[0]).height() * matrix[1];
    compiledCanvas.style.imageRendering = 'optimizeQuality';
    
    var completed = 0;
    
    var printImage = function (index, x, y) {
      var xPos = x * $(canvasSelectors[index]).width();
      var yPos = y * $(canvasSelectors[index]).height();
      
      var imageContent = $(canvasSelectors[index])[0].toDataURL('image/png');
      var img = new Image();
      
      img.onload = function() {
        compiledCanvas.getContext('2d').drawImage(this, xPos, yPos);
        completed++;
        
        if (completed == canvasSelectors.length) {
          var pic = compiledCanvas.toDataURL('image/jpeg', 0.8);
          var filename = 'pic' + Math.random(0, 999999999) + '.jpg';
          var picBin = imgUp.getBin(pic.split(',')[1]);
          
          imgUp.sendXHR(picBin, filename, 'image/jpeg', function(){
            that.showPics();
          });
        }
      };
      
      img.src = imageContent;
    };
    
    var index = 0;
    for (var y = 0; y < matrix[1]; y++) {
      for (var x = 0; x < matrix[0]; x++) {
        printImage(index, x, y);
        index++;
      }
    }
  };
  
  that.snap = function() {
    GS.snap(function(data){
      current += 1;
      if (current >= canvasSelectors.length) {
        that.complete();
      }
      else {
        that.init();
      }
    }, false);
  };
  
  that.init = function() {
    if (!GS) {
      GS = new GeoSnappy(videoSelector, canvasSelectors[current]);
    }
    else {
      GS.switchCanvas(canvasSelectors[current]);
    }
    that.showPics();
  };
  
  that.init();
  return that;
};


var PK = new Purikura('#video', ['#canvasa', '#canvas1', '#canvas2', '#canvas3'], [2, 2]);
startbutton.addEventListener('click', function(e){
  PK.snap();
});

});

})(jQuery);
