$(function() {

  // Turns form data into JSON - Helper Method
  $.fn.serializeObject = function() {
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
 };

  // Choose a random organization.
  var organizations = [
  {
    // American Civil Liberties Union
    "disclaimer": "<a href='http://aclu.org' target='_blank'>ACLU</a> will contact you about future campaigns. <a href='https://www.aclu.org/american-civil-liberties-union-privacy-statement' target='_blank'>Privacy policy</a>",
    "tag": "reset-the-net-aclu",
    "weight": 1
  },
  {
    // OpenMedia
    "disclaimer": "<a href='http://openmedia.org' target='_blank'>OpenMedia</a> will contact you about future campaigns. <a href='https://openmedia.ca/privacy' target='_blank'>Privacy policy</a>",
    "tag": "reset-the-net-openmedia",
    "weight": 0
  },
  {
    // Demand Progress
    "disclaimer": "<a href='http://demandprogress.org/' target='_blank'>Demand Progress</a> will contact you about future campaigns. <a href='http://www.demandprogress.org/privacy/' target='_blank'>Privacy policy</a>",
    "tag": "reset-the-net-demand-progress",
    "weight": 17
  },
  {
    // Fight for the Future
    "disclaimer": "<a href='http://www.fightforthefuture.org/'>Fight for the Future</a> and <a href='http://www.thecenterforrights.org/'>Center for Rights</a> will contact you about future campaigns. <a href='http://www.fightforthefuture.org/privacy/'>Privacy Policy</a>",
    "tag": "reset-the-net",
    "weight": 79
  },
  {
    // Free Press
    "disclaimer": "<a href='http://www.freepress.net/' target='_blank'>Free Press</a> will contact you about future campaigns. <a href='https://www.freepress.net/privacy-copyright' target='_blank'>Privacy policy</a>",
    "tag": "reset-the-net-freepress",
    "weight": 0
  },

  {
    // CREDO
    "disclaimer": '<a href="credoaction.com/">CREDO</a> will contact you about future campaigns. <a href="http://www.credomobile.com/Misc/Privacy.aspx">Privacy Policy</a>',
    "tag": "reset-the-net-credo",
    "weight": 3
  }
  ];

  function getScore(weight) {
    return weight * Math.random();
  }

  function getOrganization() {
    return organizations.sort(function(a, b) {
      return getScore(b.weight) - getScore(a.weight);
    })[0];
  }

  // Update!
  var organization = getOrganization();
  $('input[name=tag]').val(organization.tag);
  $('.disclaimer p').html(organization.disclaimer);
});


// If there are failures when submiting the email signup, we will post to a second server to simply backup the submission
var emailLogged = false;
var logDataFallback = function (data) {
  if(!emailLogged) {
    emailLogged = true;
    var dbData = {
      email: data.data['member[email]'],
      org: data.data.tag
    };
    $.ajax('https://email-congress.herokuapp.com/email', {
      data: dbData,
      method: 'POST',
      success: function(response){
      },
      dataType: 'json'
    });
  }
}

$(document).ready(function(){
   var $form = $('form');

   $form.submit(function(){

     // Because there is no server side error handling, we can just assume success anyway
     $('#thank-you-message').append("<p> Thanks for signing up! </p>");
     $form.remove();
     $('.disclaimer').remove();

    // Make a timeout incase the request hangs
    setTimeout(function () {
      logDataFallback({data: $form.serializeObject()});
    }, 5000)

      $.ajax($(this).attr('action'), {
        data: $(this).serialize(),
        method: 'POST',
        success: function(response){
          if(response && response.data && response.data.success === true) {
            emailLogged = true
            // If success == true in response, proceed, otherwise log the data in case
          } else {
            logDataFallback({data: $form.serializeObject()});
          }
        },
        error: function () {
          // if jQuery detects a http error, then log the data
          logDataFallback({data: $form.serializeObject()});
        },
        dataType: 'json'
      });
      return false;
   });

  // Bring down share counts
  var shareTotals = {};
  var shareUrlCount = 0;
  var showShareTotals = function () {
    if(shareUrlCount === 2) {
      var completeShareTotals = {
        facebook: shareTotals.pack.facebook + shareTotals.www.facebook,
        googleplus: shareTotals.pack.googleplus + shareTotals.www.googleplus,
        twitter: shareTotals.pack.twitter + shareTotals.www.twitter
      }

      $.each(completeShareTotals, function(network, value) {
          var count = value;
          if (count / 10000 > 1) {
              count = Math.ceil(count / 1000) + 'k'
          }
          $('[data-network="' + network + '"]').text(count);
      })
    };

  };
  var shareUrl =  'https://www.resetthenet.org';
  $.ajax('https://d28jjwuneuxo3n.cloudfront.net/?networks=facebook,twitter,googleplus&url=' + shareUrl, {
      success: function(res, err) {
        shareUrlCount++;
        shareTotals['www'] = res;
        showShareTotals();

      },
      dataType: 'jsonp',
      cache         : true,
      jsonpCallback : 'wwwCallback'
  });

  var shareUrl =  'https://pack.resetthenet.org';
  $.ajax('https://d28jjwuneuxo3n.cloudfront.net/?networks=facebook,twitter,googleplus&url=' + shareUrl, {
      success: function(res, err) {
        shareUrlCount++;
        shareTotals['pack'] = res;

        showShareTotals();
      },
      dataType: 'jsonp',
      cache         : true,
      jsonpCallback : 'packCallback'
  });
});
