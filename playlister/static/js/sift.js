var audio;
var title = "";
var unencoded_title = "";

// ajax globals
var titles;
var songs;
var username;
var refined_songs;
var playlist = "";
var curr_playlist = "";
var confidence_intervals;

$(document).ready(function() {

    // resize window on initialization
    if($(this).width() <= 600){
            $("#right-column").css("margin-right", "20px");
            $("#right-column").css("width", "initial");
    } else {
            $("#right-column").css("margin-right", "auto");
            $("#right-column").css("width", "calc(100% - 310px)");
    }

    $('#title a').attr("href", window.location.origin);
    

    //initialize sliders
    $('.slider').slider({
        range: true,
        min: 0,
        max: 100,
        values: [0,100],
        animate: "fast"
    })
    $('#loudness').slider({
        min: -60,
        max: 0,
        values: [-60,0]
    })
    var sliders = ["danceability", "energy", "loudness", "speechiness", "acousticness",
                    "instrumentalness", "valence", "popularity"]
    for (var i = 0; i < sliders.length; i++) {
        $("#" + sliders[i]).slider({
            slide: function(event, ui) {
                $("#" + event.target.id + "_val").html(ui.values[0] + " to " + ui.values[1]);
            }
        })
    }
    //end of slide initialization


    $('#get-data-button').click(function() {
        username = $("#user-input").val();
        $("#get-data-button").text('Loading...')
        $(".plr").remove()
        playlist = ""
        $.ajax({
            url: window.location.origin + '/getplaylists/?username='.concat(username) + '&token='.concat(token),
            success: function (jsontitles) {
                $("#get-data-button").text('Retrieve Playlists')
                $('.error').remove();
                $('.pl_option').remove();
                // $('.pl_option').remove();
                if (jsontitles == 'no user') {
                    $("#user-group").append('<div class="error">username is blank</div>');
                } else {
                    if (jsontitles.length > 0) {
                        titles = jsontitles.map(function(t){ return t[0] });
                        loadtitles(titles);
                        $("#playlist-group").show("fast");
                    } else {
                        $("main").append('<div class="error">user has no public playlists</div>');
                    }
                }
            },
            error: function (response) {
                console.log(response)
                $("#get-data-button").text('Retrieve Playlists')
            }
        }).responseJSON;
    });


    // $('#add-button').click(function() {
    //     var t = $("#playlist_select").val();
    //     if (t != null) {
    //         if (playlists.indexOf(t) == -1){
    //             $("#playlist-table").append("<tr class='plr'><td class='pl-title' colspan='2'>" + 
    //                 $("#playlist_select").val() +
    //                 "</td><td class='remove-button'>-</td></tr>")
    //             playlists.push(t)
    //         }
    //     }
    // })

    // $('#playlist-table').on("click", ".remove-button", function() {
    //     $(this).parent().remove();
    //     var index = playlists.indexOf($(this).prev('td').text())
    //     playlists.splice(index, 1);
    // })


    $('#songs-button').click(function() {
        playlist = $("#playlist_select").val();
        if (playlist != "") {
            if (playlist !== curr_playlist) {
                retrieve_songs()
            }
        }
    });

    $('#apply-filter').click(function() {
        if (songs != null) {
            filter_playlist()
        }
    });

   $('.toggle').click(function(e) {
        e.preventDefault()
        $(this).parent().parent().find('tr').removeClass('active');
        $(this).parent().addClass('active');
    });

    $('#apply-sort').click(function() {
        if (refined_songs != null) {
            var mode = $('.active .toggle').text()
            console.log(mode);
            if(mode === "by Feature"){
                if($('#feature_select').val() == null) {
                    $("#sort-group").append('<div class="error">Sort Feature not Specified</div>');
                } else {
                    $(".error").remove()
                    refined_songs = feature_sort(refined_songs);
                    show_results(refined_songs);
                }
            } else if(mode === "by Similarity"){
                if($('#song_select').val() == null) {
                    $("#sort-group").append('<div class="error">Sort Song not Specified</div>');
                } else {
                    $(".error").remove()
                    refined_songs = relevancy_sort(refined_songs);
                    show_results(refined_songs);
                }
            } else if(mode === "by Title Length") {
                $(".error").remove()
                refined_songs = title_sort(refined_songs);
                show_results(refined_songs);
            } else {
                $(".error").remove()
                show_results(refined_songs);
            }
        }
    });

    $("#save-button").click(function() {
        if ($("#save-input").val() == "") {
            new_name = "new playlist"
        } else {
            new_name = $("#save-input").val()
        }
        ids = refined_songs.map(function(s){ return s['id'] });
        ids = JSON.stringify(ids);
        // pass new_name and refined_songs into an ajax request
        // which will create the new playlist
        $("#save-button").text('Loading...')

        // get cookie for post
        function getCookie(name) {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        var csrftoken = getCookie('csrftoken');

        // post song data
        $.ajax({
            type: "POST",
            url: window.location.origin + "/newplaylist/",
            data: {"songs":ids, 
                   "title":new_name,
                   "token":token,
                   "csrfmiddlewaretoken":csrftoken
            },
            success: function (response){
                console.log(response)
                $(".error").remove()
                $("#save-button").text('Save Playlist')
            },
            error: function (response){
                console.log(response)
                $("#save-group").append('<div class="error">An error has occurred. Try again later.</div>');
                $("#save-button").text('Save Playlist')
            },
            dataType: 'json'
            }
        )
    })

    //------Presets------//
    $("#reset-button").click(function() {
        var setvalues = [[0,100],[0,100],[-60,0],[0,100],[0,100],[0,100],[0,100],[0,100],[1900,2016]];
        preset(setvalues);
    })
    $("#exercise-button").click(function() {
        var setvalues = [[38,100],[52,100],[-12,0],[0,48],[0,100],[0,100],[8,100],[0,100],[1900,2016]];
        preset(setvalues);
    })

    $("#relaxing-button").click(function() {
        var setvalues = [[0,82],[0,42],[-60,-9],[0,15],[0,100],[0,100],[0,71],[0,100],[1900,2016]];
        preset(setvalues);
    })

    $("#acoustic-button").click(function() {
        var setvalues = [[0,77],[0,47],[-60,-5],[0,26],[58,100],[0,100],[0,71],[0,100],[1900,2016]];
        preset(setvalues);     
    })

    function preset(setvalues){
        var sliders = ["danceability", "energy", "loudness", "speechiness", "acousticness",
                    "instrumentalness", "valence", "popularity"]
        for (var i = 0; i < sliders.length; i++) {
            $("#" + sliders[i]).slider( "values", setvalues[i])
            $("#" + sliders[i] + "_val").html(setvalues[i][0] + " to " + setvalues[i][1]);
        }
    } 
    //-------------------//


    function loadtitles(titles) {
        for (var i = 0; i < titles.length; i++) {
            $("#playlist_select").append('<option class="pl_option">' + titles[i] + '</option>');
        }
    }


    function retrieve_songs(){
        curr_playlist = playlist;
        //encode playlist titles to be passed through url
        encoded_playlist = encodeURIComponent(playlist);
        $("#songs-button").text('Loading...')
        $.ajax({
            url: window.location.origin + '/getsongs/?title='.concat(encoded_playlist) + '&username='.concat(username) + '&token='.concat(token),
            success: function(data) {
                $("#songs-button").text('Retrieve Songs');
                songs = data.songs;
                refined_songs = songs;
                if (songs == undefined) {
                    $("#playlist-group").append('<div class="error">Playlist not Specified</div>');
                } else {
                    $(".error").remove();
                    update_song_select(refined_songs);
                    show_results(refined_songs);
                    $("#filter-group").show("fast");
                    $("#sort-group").show("fast");
                    $("#results-group").show("fast");
                    $("#save-group").show("fast");
                }
            },
            error: function (response) {
                console.log(response)
                $("#songs-button").text('Retrieve Songs')
            }
        }).responseJSON
    }

    function filter_playlist() {
        ranges = get_ranges();
            //format: {"danceability": [min, max], ...}
        refined_songs = []
        //build refined_songs
        for (var i = 0; i < songs.length; i++) {
            for (var key in ranges) {
                add = true;
                boo = between(songs[i][key], ranges[key])
                if(!boo) {
                    add = false;
                    break;
                }
            }
            if(add) {
                refined_songs.push(songs[i])
            }
        }

        update_song_select(refined_songs);
        show_results(refined_songs);

        function between(x, range) {
            return x >= range[0] && x <= range[1]
        }
    }

    function get_ranges() {
        ranges = {'danceability':[0,0],'energy':[0,0], 'loudness':[0,0], 'speechiness':[0,0],
                  'acousticness':[0,0],'instrumentalness':[0,0],'valence':[0,0], 'popularity':[0,0]}
        ranges.danceability = $('#danceability').slider('values')
        ranges.energy= $('#energy').slider('values')
        ranges.loudness= $('#loudness').slider('values')
        ranges.speechiness= $('#speechiness').slider('values')
        ranges.acousticness= $('#acousticness').slider('values')
        ranges.instrumentalness= $('#instrumentalness').slider('values')
        ranges.valence= $('#valence').slider('values')
        ranges.popularity= $('#popularity').slider('values')
        return ranges
    }

    function feature_sort(isongs) {
        feature = $('#feature_select').val().toLowerCase()
        direction = $('#f_direction_select').val()
        isongs = sort(isongs, feature)
        if(direction == "Descending"){
            isongs = isongs.reverse();
        }
        return isongs;
    }

    function relevancy_sort(isongs) {
        id = $('#song_select').children(":selected").attr("id")
        index = 0
        for(var i = 0; i < isongs.length; i++) {
            if(isongs[i].id === id){
                index = i;
                break;
            }
        }
        direction = $('#r_direction_select').val()
        song = isongs[index]
        gen_distances(isongs, song)
        isongs = sort(isongs, "distance");
        if(direction == "Descending"){
            isongs = isongs.reverse();
        }
        return isongs;
    }

    function title_sort(isongs) {
        isongs = isongs.sort(function(a, b){
            a = a.name
            b = b.name
            if(a.length > b.length){
                return 1;
            }else if (a.length < b.length){
                return -1;
            } else {
                return 0;
            }
        })
        return isongs;
    }

    function gen_distances(isongs, song) {
        for(var i = 0; i < isongs.length; i++) {
            a = isongs[i].pca1 - song.pca1
            b = isongs[i].pca2 - song.pca2
            distance = a * a + b * b
            // factor in if same artist
            if(isongs[i].artist === song.artist){
                distance = distance / 2;
            }
            isongs[i].distance = distance * -1
        }
    }

    function update_song_select(isongs) {
        $('#song_select option').remove()
        $('#song_select').append('<option disabled selected>Song</option>')
        for(var i = 0; i < isongs.length; i++) {
            $('#song_select').append('<option id=' + isongs[i].id + '>' + isongs[i].name + '</option>')
        }
    }

    function show_results(isongs) {
        $('#song-list tr').remove()
        time = 0
        for(var i = 0; i < isongs.length; i++) {
            $('#song-list').append('<tr><td>' + (i+1) + "</td><td class='sartist'>  " +
                isongs[i].artist + '</td><td class="sname"><b>'+ isongs[i].name + '</b></td></tr>');
            time += isongs[i].duration
        }
    }

    function sort(isongs, feature) {
        isongs = isongs.sort(function(a, b){
            if(a[feature] > b[feature]){
                return 1;
            } else if(a[feature] < b[feature]){
                return -1;
            } else {
                return 0;
            }
        });
        return isongs
    }

    /* resize reaction */
    $(window).resize(function(){
        if($(this).width() <= 600){
            $("#right-column").css("margin-right", "20px");
            $("#right-column").css("width", "initial");
        } else {
            $("#right-column").css("margin-right", "auto");
            $("#right-column").css("width", "calc(100% - 310px)");
        }
    });

});


















