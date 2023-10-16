(function(){

    var _schema = undefined;
    var _engagements = undefined;

    function _initializeDashboard(){
        _resetUI();

        let storyID = _getIDFromURL();

        if(_isStoryIDValid(storyID)){
            _getDashboardSchema(storyID);
        }
    }

    function _onDashboardSchemaFailure(){

    }

    function _getEngagementsForStory(storyID){
        $.getJSON(`../api/v1/engagement/${storyID}`, function(data) {
            _engagements = data;
            _drawDashboard();
          })
          .fail(function(){
            _onDashboardSchemaFailure();
          })
    }

    function _getDashboardSchema(storyID){
        $.getJSON( `../stories/${storyID}/dashboard.json`, function( data ) {
          _schema = data;
          
          _getEngagementsForStory(storyID);
        })
        .fail(function(){
          _onDashboardSchemaFailure();
        });
      }

    function _getIDFromURL(){
        let lastPathElement = window.location.pathname.split("/").at(-1);
    
        if (_isStoryIDValid(lastPathElement)) {
          return lastPathElement.toUpperCase();
        } else {
          return false;
        }
      }

    function _isStoryIDValid(storyID){
        const IDPattern = /^([A-Z0-9]{10})$/g;
    
        return IDPattern.test((storyID + "").toUpperCase());
    }

    function _reloadStories(){
        _initializeDashboard();
    }

    function _resetUI(){

    }

    function _drawDashboard(){
        console.log(_schema);
        console.log(_engagements);

        $("#story-label").fadeIn(500).text(_schema.label);
        
        let harness = "";
        for(let sIndex = 0; sIndex < _schema.sections.length; sIndex++){
            let section = _schema.sections[sIndex];
            harness += "<div class='row'>";
            for(let wIndex = 0; wIndex < section.widgets.length; wIndex++){
                harness += "<div class='col' id='SECTOR_" + sIndex + "_" + wIndex + "'></div>"
            }
            harness += "</div>"
        }    
        document.getElementById("dashboard-content").innerHTML = harness; 
        
        for(let sIndex = 0; sIndex < _schema.sections.length; sIndex++){
            let section = _schema.sections[sIndex];
            for(let wIndex = 0; wIndex < section.widgets.length; wIndex++){
                let widget = section.widgets[wIndex];
                _drawWidget(widget, "SECTOR_" + sIndex + "_" + wIndex);
            }
            
        }  
    }

    function _drawWidget(widget, sector){
        switch(widget.type.split("-")[0]){
            case "AVERAGE":
                _drawSingleDisplayWidget(widget, sector);
                break;
            case "DOUGHNUT":
                _drawDoughnutWidget(widget, sector);
                break;
            case "BAR":
                _drawBarWidget(widget, sector);
                break;
        }
    }

    function _drawSingleDisplayWidget(widget, sector){
        let average = document.StoryTimeCalculations.getAverageOfValue(widget.value, _engagements, widget.condition);

        document.getElementById(sector).innerHTML += '<h1>' + (Math.round(average.value * 10) / 10).toFixed(1) + '</h1> /' + widget.scale.max;

        console.log("Average of value " + widget.value + ": " + JSON.stringify(average));
    }

    function _drawDoughnutWidget(widget, sector){
        let calculations = document.StoryTimeCalculations.getCountPerCategory(widget.value, Object.keys(widget.legend), _engagements, widget.condition);

        document.getElementById(sector).innerHTML += '<canvas id="acquisitions"></canvas>';
        var myDoughnutChart = new Chart(
            document.getElementById('acquisitions').getContext('2d'),
            {
              type: 'doughnut',
              data: {
                labels: Object.keys(calculations.values),
                datasets: [
                  {
                    data: Object.values(calculations.values)
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false
              }
            }
          );

        console.log("Values for categories: " + JSON.stringify(calculations));
    }

    function _drawBarWidget(widget, sector){
        let calculations = document.StoryTimeCalculations.getCountForValue(widget.value, _engagements, widget.condition);

        document.getElementById(sector).innerHTML += '<canvas id="barr"></canvas>';
        var myDoughnutChart_2 = new Chart(
            document.getElementById('barr').getContext('2d'),
            {
              type: 'bar',
              data: {
                labels: Object.keys(calculations),
                datasets: [
                  {
                    data: Object.values(calculations).map(obj => obj.matches)
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false
              }
            }
          );

        console.log("Count for value: " + JSON.stringify(calculations));
    }

    window.document.StoryTimeDashboard = {
        reloadStories: _reloadStories
    }

    window.onload = function() {
        _initializeDashboard();
    };

})();