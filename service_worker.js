"use strict";
var back_datas = null;
self.addEventListener('install', function (event) {    
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
});

self.addEventListener('push', function(event) {
    console.log('Received a push message', event);
  if (event.data) {
    console.log('event.data',event.data.json());
  }
  var title = 'Yay a message.';  
  var body = 'We have received a push message.';  
  var icon = '/images/icon-192x192.png';  
  var tag = 'simple-push-demo-notification-tag';

  event.waitUntil(  
    self.registration.showNotification(title, {  
      body: body,  
      icon: icon,  
      tag: tag  
    })  
  );    
});

self.addEventListener('push', function(event) {
    // cloud team
    event.waitUntil(self.registration.pushManager.getSubscription().then(
        function(subscription) {
            return pushNotification(subscription)
        }
    )); 
});


self.addEventListener('notificationclick', function(event) {  
    console.log('On notification click: ', event.notification.tag);  
    // Android doesn't close the notification when you click on it  
    // See: http://crbug.com/463146  
    event.notification.close();

    // This looks to see if the current is already open and  
    // focuses if it is  
    event.waitUntil(
        clients.matchAll({  
            type: "window"  
        })
        .then(function(clientList) {  
            for (var i = 0; i < clientList.length; i++) {  
                var client = clientList[i];  
                if (client.url == '/' && 'focus' in client)  
                    return client.focus();  
            } 
            if (clients.openWindow) {
                return clients.openWindow(back_datas.redirect_url);  
            }
        })
    );
});


function pushNotification (subscription) {
    var data = {
        'receiver_reg_id': subscription.endpoint.toString().replace("https://android.googleapis.com/gcm/send/","")
    };
    var message_request = new Request('/ajax/get_notification', {
        method: 'GET',
        //method: 'POST',
        mode: 'cors',
        //body:  JSON.stringify(data), 
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    });

    return fetch(message_request).then(function (response) {
        if (response.status == 200 || response.status == 400) {
            return response.json().then(function(data) {
                back_datas = data.result; 
                var promises = [];
                if (back_datas) {
                    var img_url = back_datas.site_path + '/static/img/browser_notification/' + back_datas.app_name + '/';
                    var title = back_datas.title;  
                    var message = back_datas.message;
                    var icon = '';  
                    var tag = back_datas.title;
                    switch(back_datas.app_name) {
                        case 'qts':
                            switch(back_datas.app_data.event_level) {
                                case 'error':
                                    icon = img_url + 'Chrome_error.png'
                                    break;
                                case 'warn':
                                    icon = img_url + 'Chrome_warning.png'
                                    break;
                                default:
                                    icon = img_url + 'icon_128x128.png'
                            }
                    }
                    promises.push(self.registration.showNotification(title, {  
                        body: message,  
                        icon: icon,
                        tag: tag                                
                    }));
                }   
                return Promise.all(promises);
            }).catch(function (e) { console.log(e); });
        }
    }).catch(function (e) { console.log(e); });     
};

function checkPermission (){
    console.log('Notification.permission',Notification.permission);
    setTimeout(checkPermission, 5000);
}
checkPermission()
