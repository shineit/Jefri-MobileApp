//  appMain.js

var namesp = {     // name space
    models: {}
};

var pushTimerRunning = false;
var currentPage = "";
var lastFormData = "";

var app = {
    init: function () {
        document.addEventListener( 'deviceready', this.onDeviceReady, false);

        var deviceReadyFunc = this.onDeviceReady;
        $( document).ready( function ( ) {
            console.log( "jQuery Ready");
            deviceReadyFunc();
        });
    },
    runTests: function() {
	    if( $( "#signInButn").hasClass('disabled')) {
			return;
	    }
        self.location = 'spec.html';
    },
    onDeviceReady: function() {     // the controller...
        if( typeof device !== "undefined") {
            console.log( "onDeviceReady " + device.uuid);
            namesp.models.deviceInfo.uuid = device.uuid;
            namesp.models.deviceInfo.IOSversion = device.version;
        }

        $('#eventIndexDiv div').hide();

        $( document).bind( 'touchmove', function (e) {  // prevent app bouncing
                e.preventDefault();
                return false;
            }
        );

        $( "#logoutButn").click( function( event) {
            $('#signInButn').addClass('disabled');   // reset the login button
	        $('#signInInput').val("");
        });

        app.getAllUsers();

        $( '#signInButn').die( 'pageshow').live( 'pageshow', app.getAllUsers);     // refresh GP data when login page displays

        $( '#signInInput').die( 'keyup').live( 'keyup', app.signInKeyUp);     //   auto fill the login field when a name matches

	    $( "[id^=form1]").click( function() {
		    $('#submitButn').removeClass('disabled');    // enable form button when radio clicked
	    });
        $( "#formMenuButn").click( function() {         // reset form when menu button clicked
	        $("#FormOne")[0].reset();
	        $('#submitButn').addClass('disabled');
        });
        $( "#submitButn").click( function() {       // form submit

            var formData = $("#FormOne").serialize();

	        /*/
            if( formData == lastFormData) {
                console.log( "avoiding dup data submit");
                return;
            }
	        /*/
            lastFormData = formData;
            console.log("Form Submit " + JSON.stringify( formData));

            $.post( namesp.models.serverUrl + '/subForm',
                { userId:namesp.models.userId, formData:formData }
            ).done( function() { /* console.log("Post ok"); */ })
                .fail( function() { console.log("Post error"); });

	        $("#FormOne")[0].reset();
	        $('#submitButn').addClass('disabled');
            return false;
        });

        var socket = io.connect( namesp.models.serverUrl);         // create new websocket

        socket.on( 'notification', function( data, ackFunc) {
            console.log( "data.newPage " + data.newPage);

            switch( data.pushType) {
                case "PageChng":
                    if( currentPage == data.newPage) {
                        console.log( "already showing " + currentPage);
                        return;
                    }
                    if( pushTimerRunning) {
                        console.log( "pushTimerRunning");
                        return;
                    }
                    currentPage = data.newPage;
                    $.mobile.changePage( "#" + currentPage);       //  do the page change

                    pushTimerRunning = true;
                    setTimeout( ignoreMorePageChanges, 3000);

                    namesp.models.deviceInfo.socketId = data.socketId;
                    namesp.models.deviceInfo.currentPage = currentPage;
                    ackFunc( namesp.models.deviceInfo);
                    break;
                case "PageQury":
                    $.post( namesp.models.serverUrl + '/pageQuery', { currentPage: currentPage}
                    ).done( function() { console.log("pageQury Post ok"); })
                        .fail( function() { console.log("pageQury Post error"); });
                    break;
                case "DeviceID":
                    $.post( namesp.models.serverUrl + '/deviceID',
                        { socketId:data.socketId,dvisId:device.uuid }
                    ).done( function() { console.log("DeviceID Post ok"); })
                        .fail( function() { console.log("DeviceID Post error"); });
                    break;
                default:
                    console.log( "data.pushType UNKNOWN " + data.pushType);
            }
        });
    },

    signInKeyUp: function( event) {
	    $('#signInButn').addClass('disabled');
	    var currentVal = $('#signInInput').val();
        if( currentVal.length < 3) {
            return;
        }
        var found = false;
        for( var indx in namesp.models.userList) {
            var item = namesp.models.userList[ indx];
            if( item.userId.toLowerCase() == currentVal.toLowerCase()) {
                found = true;
                break;
            }
            if( currentVal.toLowerCase().indexOf( item.userName.toLowerCase()) !== -1) {
                if( found) {
                    found = false;      // more than on match means keep forcing user entry
                    $('#signInInput').val( currentVal);
                    return;
                } else {
                    found = true;
                }
                $('#signInInput').val( item.userName);
            }
        }
        if( found) {
            namesp.models.userId = item.userId;
            $('#signInButn').removeClass('disabled');    // enable it
        } else {
            $('#signInInput').val( currentVal);
        }
    },
    getAllUsers: function( event) {
        $('#signInInput').val("");
        $.post( namesp.models.serverUrl + '/getUsers')
            .done( function( data) { console.log("success getUsers " + data.length); namesp.models.userList = data; })
            .fail( function() { console.log("error getUsers"); });
    },
	signIn: function( event) {

        if( $( "#signInButn").hasClass('disabled')) {
            event.preventDefault();
            return false;
        }
        if( namesp.models.userList.length > 0) {
            namesp.models.userId = namesp.models.userList[0].userId;
        }
    }
};

function ignoreMorePageChanges() {
    pushTimerRunning = false;
}



