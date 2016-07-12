var audio;
var titles;
var data;
var title = "";
var unencoded_title = "";
var username;
var graph_type = "scatter";
$(document).ready(function() {

    $('#get_data_button').click(function() {
        var jsontitles = gettitles();
        console.log(jsontitles);
        $('.error').remove();
        $('#pl_selections').remove();
        if (jsontitles == 'no public playlists') {
            $('<div class="error">username does not exist</div>').insertAfter("#username");
        } else {
            if (jsontitles.length > 0) {
                titles = jsontitles.map(function(t) {
                    return t['0'] });
                $('aside').append('<div id="pl_selections">' +
                    '<div class="select-label">Select Playlist</div>' +
                    '<div class="select">' +
                    '    <select id="playlist_select">' +
                    '    </select>' +
                    '</div>' +
                    '<div class="select-label x-label">Select x-values</div>' +
                    '<div class="select">' +
                    '    <select id="x_select">' +
                    '       <option>Order</option>' +
                    '       <option>Danceability</option>' +
                    '       <option>Energy</option>' +
                    '       <option>Loudness</option>' +
                    '       <option>Speechiness</option>' +
                    '       <option>Acousticness</option>' +
                    '       <option>Instrumentalness</option>' +
                    '       <option>Valence</option>' +
                    '       <option>Tempo</option>' +
                    '       <option>Duration</option>' +
                    '       <option>Popularity</option>' +
                    '       <option>Release_Date</option>' +
                    '   </select>' +
                    '</div>' +
                    '<div class="select-label y-enable">Select y-values</div>' +
                    '<div class="select y-enable">' +
                    '   <select id="y_select">' +
                    '       <option>Order</option>' +
                    '       <option>Danceability</option>' +
                    '       <option>Energy</option>' +
                    '       <option>Loudness</option>' +
                    '       <option>Speechiness</option>' +
                    '       <option>Acousticness</option>' +
                    '       <option>Instrumentalness</option>' +
                    '       <option>Valence</option>' +
                    '       <option>Tempo</option>' +
                    '       <option>Duration</option>' +
                    '       <option>Popularity</option>' +
                    '       <option>Release_Date</option>' +
                    '   </select>' +
                    '</div>' +
                    '<div id="go_button">Go</div>')
                loadtitles(titles);
            } else {
                $('<div class="error">user has no public playlists</div>').insertAfter("#username");
            }
        }
    })

    $(document).on('click', '#go_button', function() {
        console.log("at go button");
        if ($("#playlist_select").val() != unencoded_title) {
            console.log("at playlistselect");
            if (graph_type == "scatter") {
                createscatter();
            } else {
                createhist();
            }
        }
    })

    $(document).on('click', '#scatter_toggle', function() {
        graph_type = "scatter";
        $("#scatter_toggle").css("background-color", "#FFFFFF");
        $("#scatter_toggle").css("color", "#041A0D");
        $("#hist_toggle").css("background-color", "#041A0D");
        $("#hist_toggle").css("color", "#FFFFFF");
        $(".y-enable").css('display', 'block');
        $(".x-label").text("Select x-values");
        if ($("main svg").length > 0) {
            $("svg").remove();
            $(".tooltip").remove();
            $(".details").remove();
            scatter(data);
        }
    })
    $(document).on('click', '#hist_toggle', function() {
        graph_type = "histogram";
        $("#hist_toggle").css("background-color", "#FFFFFF");
        $("#hist_toggle").css("color", "#041A0D");
        $("#scatter_toggle").css("background-color", "#041A0D");
        $("#scatter_toggle").css("color", "#FFFFFF");
        $(".y-enable").css('display', 'none');
        $(".x-label").text("Select values")
        if ($("main svg").length > 0) {
            var audio = document.getElementById('preview_song');
            audio.pause();
            $("svg").remove();
            $(".tooltip").remove();
            $(".details").remove();
            hist(data);
        }
    })

    $(window).resize(function() {
        if ($("main svg").length > 0) {
            clearTimeout(resizeTimer);
            var resizeTimer = setTimeout(function() {
                //delete old svg and tooltip and plot new one
                var audio = document.getElementById('preview_song');
                audio.pause();
                $("svg").remove();
                $(".tooltip").remove();
                $(".details").remove();
                if (graph_type == "scatter") {
                    scatter(data);
                } else {
                    hist(data);
                }
            }, 250);
        }
    });

    function createscatter() {
        unencoded_title = $("#playlist_select").val();
        title = encodeURIComponent(unencoded_title);
        console.log("in create: title=")
        console.log(title)
        data = getdata(title);
        $("svg").remove();
        $(".tooltip").remove();
        $(".details").remove();
        scatter(data);
    }

    function createhist() {
        unencoded_title = $("#playlist_select").val();
        title = encodeURIComponent(unencoded_title);
        console.log("in create: title=")
        console.log(title)
        data = getdata(title);
        $("svg").remove();
        $(".tooltip").remove();
        $(".details").remove();
        hist(data);
    }

    //lists all playlists into the 'pick playlist' selection box
    function gettitles() {
        console.log("at loadtitles")
        username = $("#username_input").val();
        var jsontitles = $.ajax({
            async: false,
            url: window.location.href + 'getplaylists/?username='.concat(username),
        }).responseJSON;
        console.log(jsontitles)
        return jsontitles;
    }

    //lists all playlists into the 'pick playlist' selection box
    function loadtitles(titles) {
        console.log(titles);
        for (var i = 0; i < titles.length; i++) {
            $("#playlist_select").append('<option>' + titles[i] + '</option>');
        }
    }

    //given a playlist title, return the playlist model as a json derived object
    function getdata(title) {
        console.log("at getdata")
        console.log(username)
        var data = $.ajax({
            async: false,
            url: window.location.href + 'getsongs/?title='.concat(title) + '&username='.concat(username),
        }).responseJSON;
        console.log(data)
            //convert release dates from strings to integer year
        data = data.map(function(d) {
            d['release_date'] = parseInt(d['release_date'].substring(0, 4));
            return d;
        })

        return data;
    }
    //---------------------------------------------------------------------------------------
    function scatter(playlist) {
        var x = $("#x_select").val().toLowerCase();
        var y = $("#y_select").val().toLowerCase();
        var dmax = d3.max(playlist, function(d) {
            return d['duration'] });
        var dmin = d3.min(playlist, function(d) {
            return d['duration'] });
        var omax = d3.max(playlist, function(d) {
            return d['order'] });
        //console.log("dmin = " + dmin + "  dmax = " + dmax);
        var domains = {
                'order': [0, omax],
                'danceability': [-4, 100],
                'energy': [-4, 100],
                'loudness': [-50, 0],
                'speechiness': [-4, 100],
                'acousticness': [-4, 100],
                'instrumentalness': [-4, 100],
                'valence': [-4, 100],
                'tempo': [40, 220],
                'duration': [dmin - 15, dmax], //must get from input
                'popularity': [-4, 100],
                'release_date': [1900, 2020]
            }
            // -- 'Global' Vars -- //
        var dimens = updateWindow();
        var w = dimens[0];
        var h = dimens[1];
        var padding = 40;

        var xscale = d3.scale.linear()
            .domain(domains[x])
            .range([padding, w - padding]);

        var yscale = d3.scale.linear()
            .domain(domains[y])
            .range([h - padding, padding]);

        // -- Creating a Single Graph -- //
        //create SVG element
        var svg = d3.select("main")
            .append("svg")
            .attr("width", w - 20)
            .attr("height", h - 20);

        //ceate tooltip
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var details = d3.select("aside").append("div")
            .attr("class", "details")
            .style("opacity", 0);

        //draw dots
        svg.selectAll("circle")
            .data(playlist)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xscale(d[x]);
            })
            .attr("cy", function(d) {
                return yscale(d[y]);
            })
            .attr("r", 4)
            .attr("fill", function(d) {
                if (d["preview_url"] == "") {
                    return "#A4ADC9";
                } else {
                    return "#495780";
                }
            })
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9)

                if (d3.event.pageX > w - 50) {
                    tooltip.html('<div class="tooltip"><b>' + d["name"] +
                            " : " + d["artist"] + "</div>")
                        .style("left", (d3.event.pageX - 150) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                } else {
                    tooltip.html('<div class="tooltip"><b>' + d["name"] +
                            " : " + d["artist"] + "</div>")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(400)
                    .style("opacity", 0);
            })
            .on("click", function(d) {
                tooltip.transition()
                    .duration(400)
                    .style("opacity", 0);
                var audio = document.getElementById('preview_song');
                audio.pause();
                details.transition()
                    .duration(200)
                    .style("opacity", 1);
                details.html('<table><b>' +
                    '<tr><th colspan="2">' + d['name'] + ': ' + d['artist'] + '</th></b></tr>' +
                    '<tr><td>' + $("#x_select").val() + '</td><td>' + d[x] + '</td></tr>' +
                    '<tr><td>' + $("#y_select").val() + '</td><td>' + d[y] + '</td></tr>' +
                    '<table>');
                if (d["preview_url"] != "") {
                    if (audio.getAttribute('src') == d["preview_url"]) {
                        d3.select(this)
                            .attr("r", 4)
                            .attr("fill", function(d) {
                                if (d["preview_url"] == "") {
                                    return "#A4ADC9";
                                } else {
                                    return "#495780";
                                }
                            });
                        audio.setAttribute('src', "")
                    } else {
                        svg.selectAll("circle")
                            .attr("r", 4)
                            .attr("fill", function(d) {
                                if (d["preview_url"] == "") {
                                    return "#A4ADC9";
                                } else {
                                    return "#495780";
                                }
                            });
                        d3.select(this)
                            .attr("r", 5)
                            .attr("fill", "#65C279");
                        audio.setAttribute('src', d["preview_url"]);
                        audio.play();
                    }
                } else {
                    svg.selectAll("circle")
                        .attr("r", 4)
                        .attr("fill", function(d) {
                            if (d["preview_url"] == "") {
                                return "#A4ADC9";
                            } else {
                                return "#495780";
                            }
                        });
                }
            });

        //create xaxis
        var xaxis = d3.svg.axis().scale(xscale).orient("bottom").ticks(10)
            .tickFormat(d3.format("d"));
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xaxis);
        svg.append("text")
            .attr("class", "x label")
            .attr("x", w - 40)
            .attr("y", h - 45)
            .style("text-anchor", "end")
            .text(x);

        //create yaxis
        var yaxis = d3.svg.axis().scale(yscale).orient("left").ticks(10)
            .tickFormat(d3.format("d"));
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding + ",0)")
            .call(yaxis);
        svg.append("text")
            .attr("class", "y label")
            .attr("transform", "rotate(-90)")
            .attr("x", -40)
            .attr("y", 43)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(y);

        d3.select("#go_button").on("click", function() {
            x = $("#x_select").val().toLowerCase();
            y = $("#y_select").val().toLowerCase();
            domains["duration"] = [dmin - 15, dmax]; //must get from input
            domains["order"] = [0, omax]; //must get from input

            xscale.domain(domains[x]);
            yscale.domain(domains[y]);

            svg.selectAll("circle")
                .data(playlist)
                .transition()
                .duration(500)
                .attr("cx", function(d) {
                    return xscale(d[x]);
                })
                .attr("cy", function(d) {;
                    return yscale(d[y]);
                });

            // Update X Axis
            svg.select(".x.axis")
                .transition()
                .duration(500)
                .call(xaxis);

            // Update Y Axis
            svg.select(".y.axis")
                .transition()
                .duration(500)
                .call(yaxis);

            svg.select(".x.label")
                .text(x)

            svg.select(".y.label")
                .text(y)

        });
    }

    //---------------------------------------------------------------------------------------
    function hist(playlist) {
        var x = $("#x_select").val().toLowerCase();
        var dmax = d3.max(playlist, function(d) {
            return d[x] });
        var dmin = d3.min(playlist, function(d) {
            return d[x] });

        // -- 'Global' Vars -- //
        var dimens = updateWindow();
        var w = dimens[0];
        var h = dimens[1];
        var padding = 30;
        var bincount = (playlist.length) / 5;
        if (bincount < 2) {
            bincount = 2;
        }
        if (bincount > 100) {
            bincount = 100;
        }

        var data = playlist.map(function(i) {
            return i[x];
        })

        var histogram = d3.layout.histogram()
            .bins(bincount)
            (data);

        var xscale = d3.scale.linear()
            .domain([dmin, dmax])
            .range([padding, w - padding]);

        var yscale = d3.scale.linear()
            .domain([0, d3.max(histogram.map(function(i) {
                return i.length
            }))])
            .range([padding, h - padding]); //20 accounts for title width

        var svg = d3.select("main")
            .append("svg")
            .attr("width", w - padding)
            .attr("height", h - padding)
            .append("g")
            .attr("transform", "translate(20,0)");

        var group = svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + h + ")")
            .call(d3.svg.axis(x));

        var bars = svg.selectAll(".bar")
            .data(histogram)
            .enter()
            .append("g");

        bars.append("rect")
            .attr("x", function(d) {
                return xscale(d.x);
            })
            .attr("y", function(d) {
                return h - yscale(d.y);
            })
            .attr("width", function(d) {
                return ((w - 3 * padding) / bincount);
            })
            .attr("height", function(d) {
                return yscale(d.y);
            })
            .attr("fill", "#495780")

        svg.selectAll("rect")
            .on("mouseover", function(d) {
                d3.select(this)
                    .attr("fill", "#5D70A9")
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("fill", "#495780")
            })

        //create title
        bars.append("text")
            .text(x)
            .attr("x", (w / 2))
            .attr("y", 12)
            .attr("text-anchor", "middle")

        d3.select("#go_button").on("click", function() {
            x = $("#x_select").val().toLowerCase();
            var dmax = d3.max(playlist, function(d) {
                return d[x] });
            var dmin = d3.min(playlist, function(d) {
                return d[x] });

            data = playlist.map(function(i) {
                return i[x]; })

            histogram = d3.layout.histogram()
                .bins(bincount)
                (data);

            xscale.domain([dmin, dmax]);

            $("rect").remove();

            bars = svg.selectAll(".bar")
                .data(histogram)
                .enter()
                .append("g");

            bars.append("rect")
                .attr("x", function(d) {
                    return xscale(d.x);
                })
                .attr("y", function(d) {
                    return h - yscale(d.y);
                })
                .attr("width", function(d) {
                    return ((w - 3 * padding) / bincount);
                })
                .attr("height", function(d) {
                    return yscale(d.y);
                })
                .attr("fill", "#495780");

            svg.selectAll("rect")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .attr("fill", "#A4ADC9")
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .attr("fill", "#495780")
                });


        });
    }

    //---------------------------------------------------------------------------------------
    function updateWindow() {
        var w = $('main').width();
        var h = $('main').height();
        return [w, h];
    }


});