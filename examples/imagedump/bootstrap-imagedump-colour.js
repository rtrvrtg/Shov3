var rmsStressTest = function(){};
var runUpload = function(){};

(function($) {

$(document).ready(function() {

var colourBreakdown = function(r, g, b) {
  var h = Color.RGBtoHSL([r, g, b]);
  for (var i = 0; i < h.length; i++) {
    h[i] = Math.floor(h[i] * 255);
  }
  return h;
};

var coloursInImage = function(dataURL, numColours, callback, granularity, finalData, file) {
  if (!granularity) granularity = 5;
  granularity = Math.max(1, Math.abs(granularity)); 
  
  var colours = {};
  
  var img = new Image();
  
  var runColour = function(c) {
    return Math.round(Math.round(c / 0x33) * 0x33);
  };
  var prepHex = function(c) {
    var val = parseInt(c, 16) + '';
    if (val.length < 3) {
      var arr = [];
      for (var i = val.length; i > 0; i--) {
        arr.push('0');
      }
      val = arr.join('') + val;
    }
    return val;
  };
  
  img.onload = function(){
    
    var canvas = $('<canvas/>')[0];
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.getContext('2d').drawImage(this, 0, 0, this.width, this.height);
    
    for (var x = 0; x < this.width; x += granularity) {
      for (var y = 0; y < this.height; y += granularity) {
        var pixelData = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        var rgb = [pixelData[0], pixelData[1], pixelData[2]];
        
        var red = runColour(rgb[0]);
        var green = runColour(rgb[1]);
        var blue = runColour(rgb[2]);
        
        var hsl = colourBreakdown(red, green, blue);
        var hslKey = [
          prepHex(hsl[0]),
          prepHex(hsl[1]),
          prepHex(hsl[2])
        ].join('/');
        
        if (!colours[hslKey]) {
          colours[hslKey] = { hslKey: hslKey, count: 0 };
        }
        colours[hslKey].count += 1;
      }
    }
    
    colours = _.sortBy(colours, function(val){
      return val.count;
    }).reverse();
    var colourKeys = _(colours).pluck('hslKey');
    colourKeys = colourKeys.slice(0, numColours);
    
    callback(file, finalData, colourKeys);
  };
  
  img.src = dataURL;
};



var showMeTheMoney = function(response) {
  // ui
  $('#filez').val('').removeAttr('disabled');
  
  // show image lol
  viewImages();
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

var imgUpPlaceholder = new Shov3({
  bucket:       'my-bucket',
  acl:          'public-read',
  redirect:     'http://example.com/done',
  contentType:  'image/jpeg',
  folder:       'imagedump-colour/',
  aws_key:      '==ADD_YOUR_AWS_KEY==',
  secret:       '==ADD_YOUR_AWS_SECRET=='
}, jQuery);

var runColours = function(file, finalData, colours){
  
  var pb = progressBar(file.name, '.progress-container');
  
  $('#debug').text($('#debug').text() + ' ' + colours[0]);
  
  var imgUp = new Shov3({
    bucket:       'my-bucket',
    acl:          'public-read',
    redirect:     'http://example.com/done',
    contentType:  'image/jpeg',
    folder:       'imagedump-colour/' + colours[0] + '/',
    aws_key:      '==ADD_YOUR_AWS_KEY==',
    secret:       '==ADD_YOUR_AWS_SECRET=='
  }, jQuery);
  
  imgUp.sendXHR(finalData, file.name, file.type, showMeTheMoney, pb.update);
};

runUpload = function() {
  var filez = $('#filez').get(0);
  var fileList = filez.files;
  
  var sendFile = function(file) {
    var r = new FileReader();
    
    r.onload = function (oFREvent) {
      if (oFREvent.eventPhase != 2) return;
      
      var finalData = imgUpPlaceholder.getAB(oFREvent.target.result);
      var dataURL = 'data:' + file.type + ';base64,' + btoa(oFREvent.target.result);
      
      var granularity = Math.floor(Math.sqrt(finalData.length) / 10);
      coloursInImage(dataURL, 1, runColours, granularity, finalData, file);
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

var viewImages = function(){
  imgUpPlaceholder.listDir(function(results){
    $(results).find('Contents').each(function(){
      var key = $(this).find('Key').text();
      var imgUrl = 'http://my-bucket.s3.amazonaws.com/' + key;
      var id = $(this).find('ETag').text().replace(/"/g, '');
      
      var sortFactorParts = key.split('imagedump-colour/')[1].split('/');
      var sortFactor = sortFactorParts.slice(0, 3);
      
      if ($('#' + id, '#crap').length == 0) {
        var img = $('<img />', {
          id: id,
          src: imgUrl,
          sortfactorh: sortFactor[0], 
          sortfactors: sortFactor[1], 
          sortfactorl: sortFactor[2], 
          style: 'max-width: 50px; display: inline-block; vertical-align: top; '
        });
        
        var h = parseInt(img.attr('sortfactorh'), 10);
        var s = parseInt(img.attr('sortfactors'), 10);
        var l = parseInt(img.attr('sortfactorl'), 10);
        var placed = false;
        
        $('#crap img').each(function(){
          var ok = false;
          
          var checkH = (h <= parseInt($(this).attr('sortfactorh'), 10));
          var checkS = (s <= parseInt($(this).attr('sortfactors'), 10));
          var checkL = (l <= parseInt($(this).attr('sortfactorl'), 10));
          
          if (checkH && checkS && checkL) {
            ok = true;
          }
          
          if (ok) {
            img.insertBefore($(this));
            placed = true;
            return false;
          }
        });
        
        if (!placed) {
          img.appendTo('#crap');
        }
      }
    });
  });
};

viewImages();

});

})(jQuery);
