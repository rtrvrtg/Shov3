var rmsStressTest = function(){};
var runUpload = function(){};

(function($) {

$(document).ready(function() {

var imgUp = new Shov3({
  bucket:       'my-bucket',
  acl:          'public-read',
  redirect:     'http://example.com/done',
  contentType:  'image/jpeg',
  folder:       'purikura/',
  aws_key:      '==ADD_YOUR_AWS_KEY==',
  secret:       '==ADD_YOUR_AWS_SECRET=='
}, jQuery);

var showMeTheMoney = function(response) {
  // show image lol
  var url = 'http://my-bucket.s3.amazonaws.com/' + response[1];
  $('<img />', {src: url, style: 'max-width: 300px; display: inline-block; vertical-align: top;'}).appendTo('#crap');
  
  // ui
  $('#filez').val('').removeAttr('disabled');
  $('#rmsit').removeAttr('disabled');
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

runUpload = function() {
  var filez = $('#filez').get(0);
  var fileList = filez.files;
  
  var sendFile = function(file) {
    var pb = progressBar(file.name, '.progress-container');
    var r = new FileReader();
    
    r.onload = function (oFREvent) {
      if (oFREvent.eventPhase != 2) return;
      var finalData = imgUp.getAB(oFREvent.target.result);
      imgUp.sendXHR(finalData, file.name, file.type, showMeTheMoney, pb.update);
    };
    
    r.readAsBinaryString(file);
  };
  
  if (window.File && window.FileReader && window.FileList && window.Blob && fileList.length > 0) {
    var filesDone = 0;
    $('#filez').attr('disabled', 'disabled');
    
    for (var i = 0; i < fileList.length; i++) {
      sendFile(fileList[i]);
    }
  }
};

rmsStressTest = function() {
  // ui
  $('#rmsit').attr('disabled', 'disabled');
  
  var rms = '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';
  var filename = 'rms' + Math.random(0, 999999999) + '.jpg';
  var rmsBin = imgUp.getBin(rms);
  
  imgUp.sendXHR(rmsBin, filename, 'image/jpeg', showMeTheMoney);
};

});

})(jQuery);
