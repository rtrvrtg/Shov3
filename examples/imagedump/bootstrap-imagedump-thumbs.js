var rmsStressTest = function(){};
var runUpload = function(){};

(function($) {

$(document).ready(function() {

var imgUp = new Shov3({
  bucket:       'my-bucket',
  acl:          'public-read',
  redirect:     'http://example.com/done',
  contentType:  'image/jpeg',
  folder:       'thumbnailer/',
  aws_key:      '==ADD_YOUR_AWS_KEY==',
  secret:       '==ADD_YOUR_AWS_SECRET=='
}, jQuery);

var imgThumbUp = new Shov3({
  bucket:       'my-bucket',
  acl:          'public-read',
  redirect:     'http://example.com/done',
  contentType:  'image/jpeg',
  folder:       'thumbnailer/thumbs/',
  aws_key:      '==ADD_YOUR_AWS_KEY==',
  secret:       '==ADD_YOUR_AWS_SECRET=='
}, jQuery);

var reunite = function(response) {
  // show image lol
  var url = 'http://my-bucket.s3.amazonaws.com/' + response[1];
  var thumbUrl = 'http://my-bucket.s3.amazonaws.com/' + response[1].replace('thumbnailer/', 'thumbnailer/thumbs/');
  
  var link = $('<a />', {
    href: url,
    target: '_blank'
  });
  
  var img = $('<img />', {src: thumbUrl, style: ' width: 48px; height: 48px; display: inline-block; vertical-align: top;'});
  
  img.appendTo(link);
  link.appendTo('#crap');
  
  // ui
  $('#filez').val('').removeAttr('disabled');
};

var progressBar = function(name, container) {
  var pName = name.replace(/[^a-zA-Z0-9_-]/, '');
  var progress = $('<progress />', {
    id: pName
  });
  $(container).append(progress);
  
  var that = {};
  
  that.update = function(e) {
    var prog = $('#' + pName);
    
    var removing = false;
    var remove = function() {
      if (!!removing) return;
      
      removing = true;
      setTimeout(function(){
        prog.slideUp('slow', function(){
          $(this).remove();
        });
      }, 1000);  
    };
    
    if (e.lengthComputable) {
      prog.attr({
        value: e.loaded,
        max: e.total
      });
      
      $('#debug').text($('#debug').text() + ' ' + e.loaded + ',' + e.total);
      
      if (e.loaded == e.total) {
        remove();
      }
      
      if (e.eventPhase == 2) {
        remove();      
      }
    }
  };
  
  return that;
};

var makeThumbnail = function(dataURL, filename, completion) {
  var img = new Image();
  
  img.onload = function(){
    var myWidth = this.width;
    var myHeight = this.height;
    
    var baseDim = myWidth;
    var basePos = [
      0,
      Math.abs(Math.floor((myHeight - myWidth) / 2))
    ];
    if (myWidth > myHeight) {
      baseDim = myHeight;
      var basePos = [
        Math.abs(Math.floor((myWidth - myHeight) / 2)),
        0
      ];
    }
    
    var canvas = $('<canvas/>')[0];
    canvas.width = 96;
    canvas.height = 96;
    canvas.style.imageRendering = 'optimizeQuality';
    canvas.getContext('2d').drawImage(this, basePos[0], basePos[1], baseDim, baseDim, 0, 0, 96, 96);
    
    var newDataURL = canvas.toDataURL('image/jpeg', 0.5);
    var dataBin = imgUp.getBin(newDataURL.split('base64,')[1]);
    imgThumbUp.sendXHR(dataBin, filename, 'image/jpeg', function(){
      completion();
    });
  };
  
  img.src = dataURL;
};

var sendFile = function(file) {
  var pb = progressBar(file.name, '.progress-container');
  var r = new FileReader();
  
  r.onload = function (oFREvent) {
    if (oFREvent.eventPhase != 2) return;
    var finalData = imgUp.getAB(oFREvent.target.result);
    
    var dataURI = 'data:' + file.type + ';base64,' + btoa(oFREvent.target.result);
    
    // create Thumbnail
    var thumbnailData = makeThumbnail(dataURI, file.name, function(){
      imgUp.sendXHR(finalData, file.name, file.type, reunite, pb.update);
    });
    
  };
  
  r.readAsBinaryString(file);
};

runUpload = function() {
  var filez = $('#filez').get(0);
  var fileList = filez.files;
  
  if (window.File && window.FileReader && window.FileList && window.Blob && fileList.length > 0) {
    var filesDone = 0;
    $('#filez').attr('disabled', 'disabled');
    
    for (var i = 0; i < fileList.length; i++) {
      sendFile(fileList[i]);
    }
  }
};

});

})(jQuery);
