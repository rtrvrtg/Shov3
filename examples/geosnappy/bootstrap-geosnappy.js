var rmsStressTest = function(){};
var runUpload = function(){};

(function($) {

$(document).ready(function() {

var GS = new GeoSnappy('#video', '#canvas');

startbutton.addEventListener('click', function(e){
  e.preventDefault();
  GS.snap(function(data){
    
    var dirChunks = [];
    dirChunks[0] = [
      Math.floor(data.coords.latitude), 
      Math.floor(data.coords.longitude)
    ];
    dirChunks[1] = [
      Math.round((data.coords.latitude - dirChunks[0][0]) * 100), 
      Math.round((data.coords.longitude - dirChunks[0][1]) * 100)
    ];
    
    var dirSet = [];
    for (var i in dirChunks) {
      dirSet.push(dirChunks[i].join('x'));
    }
    
    var dir = dirSet.join('/');
    
    var folder = 'geosnappy/' + dir;
    
    var imgUp = new Shov3({
      bucket:       'my-bucket',
      acl:          'public-read',
      redirect:     'http://example.com/done',
      contentType:  'image/jpeg',
      folder:       'geosnappy/',
      aws_key:      '==ADD_YOUR_AWS_KEY==',
      secret:       '==ADD_YOUR_AWS_SECRET=='
    }, jQuery);
    
    var pic = data.photo;
    var filename = 'pic' + Math.random(0, 999999999) + '.jpg';
    var picBin = imgUp.getBin(pic.split(',')[1]);
    
    imgUp.sendXHR(picBin, filename, 'image/jpeg', function(){
      imgUp.listDir(function(results){
        $(results).find('Contents').each(function(){
          var imgUrl = 'http://my-bucket.s3.amazonaws.com/' + $(this).find('Key').text();
          var id = $(this).find('ETag').text().replace(/"/g, '');
          
          if ($('#' + id, '#crap').length == 0) {
            $('<img />', {
              id: id,
              src: imgUrl,
              style: 'max-width: 200px; display: inline-block; vertical-align: top; '
            }).appendTo('#crap');
          }
        });
      });
    });
    
  }, true);
}, false);

});

})(jQuery);
