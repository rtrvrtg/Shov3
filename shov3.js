// Shov3 - An experimental JavaScript library for putting files on S3-compatible file stores.

var Shov3Prefs = {
  endpoint: 's3.amazonaws.com'
};

var Shov3 = function(options, $) {
  var params = {};
  var defaultParams = {
    bucket: null,
    key: null,
    acl: 'public-read',
    aws_key: null,
    secret: null,
    redirect: null,
    folder: ''
  };
  
  $.extend(true, params, defaultParams);
  $.extend(true, params, options);
  
  var that = {};
  
  // Generates S3 access policy string
  // @params name: Name of object to access
  // @params contentType: MIME Type of object to access
  
  that.policy = function(name, contentType) {
    var POLICY_JSON = { 
      "expiration": "2013-12-31T12:00:00.000Z", // @TODO nicer date string
      "conditions": [
        ["eq", "$bucket", params.bucket],
        ["starts-with", "$key", params.folder + name],
        {"acl": params.acl},
        {"success_action_redirect": params.redirect},
        {"x-amz-meta-filename": name},
        ["starts-with", "$Content-Type", contentType]
      ]
    };
    return Base64.encode(JSON.stringify(POLICY_JSON));
  };
  
  // Generates S3 access signature
  // @params name: Name of object to access
  // @params contentType: MIME Type of object to access  
  
  that.signature = function(name, contentType) {
    return b64_hmac_sha1(params.secret, that.policy(name, contentType));
  };
  
  // Turn Base64 string into Uint8Array
  // @params b64Str: Base64 string
  
  that.getBin = function(b64Str) {
    var bin = window.atob(b64Str);
    return that.getAB(bin);
  };

  // Turn binary string into Uint8Array
  // @params bin: Binary string
  
  that.getAB = function(bin) {
    var ab = new ArrayBuffer(bin.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < bin.length; i++) {
        ia[i] = bin.charCodeAt(i);
    }
    
    return ia;
  };
  
  // Send XHR request to S3-compatible store
  // @params bin: Binary content to send
  // @params name: Name of object to send
  // @params contentType: MIME Type of object to send
  // @params callback: Triggered on success
  // @params progressCallback: Triggered on progress update
  
  that.sendXHR = function(bin, name, contentType, callback, progressCallback) {
    var fd = new FormData();
    
    fd.append('key', params.folder + name);
    fd.append('acl', params.acl);
    fd.append('Content-Type', contentType);
    fd.append('AWSAccessKeyId', params.aws_key);
    fd.append('success_action_redirect', params.redirect);
    fd.append('x-amz-meta-filename', name);
    fd.append('Policy', that.policy(name, contentType));
    fd.append('Signature', that.signature(name, contentType));
    
    var binBlob = new Blob([bin], {type: contentType});
    fd.append('file', binBlob);
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'http://' + params.bucket + '.' + Shov3Prefs.endpoint);  
    
    xhr.onload = function() {
    };
    
    xhr.upload.addEventListener('progress', function(e) {
      if (!!progressCallback && $.isFunction(progressCallback)) {
        progressCallback(e);
      }
    }, false);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4)  { return; }
      
      xhr = new XMLHttpRequest();
      xhr.open("GET", params.redirect + "?key=" + params.folder + name, false);
      xhr.send(null);
      
      callback([
        params.bucket, 
        params.folder + name, 
        ''
      ]);
    };

    xhr.send(fd);
  };
  
  // List directory
  // @params callback: Triggered on success
  
  that.listDir = function(callback) {
    $.ajax({
      url: 'http://' + params.bucket + '.' + Shov3Prefs.endpoint,
      data: {
        'prefix': params.folder
      },
      headers: {
      },
      dataType: 'xml',
      beforeSend: function(xhr) {
      },
      success: function(data, textStatus, jqXHR) {
        callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    });
  };
  
  return that;
};

