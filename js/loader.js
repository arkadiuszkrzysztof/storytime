/*
  Copyright © 2023 NotForSquares AK. All rights to the portal and presented stories reserved.
  For more info visit http://notforsquar.es
*/

(function(){
  const Types = {
    Story: "story",
    Decision: "decision",
    Input: "input"
  }

  var _schema = undefined;
  var _firstOpen = true;

  function _getStoryID(){
    return localStorage.getItem("id");
  }

  function _setIDs(storyID, engagementID){
    if(_getStoryID() && _getStoryID() !== storyID){
      localStorage.clear();
    }

    if(_getEngagementID() && _getEngagementID() !== engagementID){
      localStorage.clear();
    }

    localStorage.setItem("id", storyID);
    localStorage.setItem("engagement", engagementID);
  }

  function _getEngagementID(){
    return localStorage.getItem("engagement");
  }

  function _getCurrentStep(){
    return (localStorage.getItem("step") || "START");
  }

  function _setCurrentStep(step){
    localStorage.setItem("step", step);
  }

  function _getPoints(){
    return (localStorage.getItem("points") || 0);
  }

  function _getPointsData(){
    let pointsData = localStorage.getItem("pointsData") || "{}";

    return JSON.parse(pointsData);
  }

  function _setPointsData(data){
    localStorage.setItem("pointsData", JSON.stringify(data));
  }

  function _addPoints(points){
    if(parseInt(points) === 0){
      return;
    }

    let currentStep = _getCurrentStep();
    let pointsData = _getPointsData();
    if(pointsData[currentStep]){
      return;
    }

    localStorage.setItem("points", parseInt(_getPoints()) + parseInt(points));
    pointsData[currentStep] = points;
    _setPointsData(pointsData);
  }

  function _loadStoryProgress(progressSnapshot){
    for(var key in progressSnapshot){
      localStorage.setItem(key, progressSnapshot[key]);
    }
  }

  function _uploadStoryProgress(engagementID){
    $.ajax({
      url: `./api/v1/engagement/${(engagementID ? engagementID : _getEngagementID())}`,
      type: 'PUT',
      data: JSON.stringify(
              Object.fromEntries(
                Object.entries(localStorage).filter(
                  ([key, value]) => _schema.values.includes(key)
                )
              )
            )
    })
  }

  function _resetUI(){
    $("#step-welcome").hide();
    $("#step-error").hide();
    $("#step-story").hide();
    $("#step-decision").hide();
    $("#story-input").hide();
    $("#story-label").hide();
    $("#story-replay").hide();
  }

  function _initializeApplication(){
    _resetUI();

    var loadElement = _getIDFromURL();

    if (!loadElement) {
      _onFirstLoad();
      return;
    }

    if(loadElement.type === "story"){
      _getStorySchema(loadElement.id);
    } else if(loadElement.type === "engagement"){
      $.getJSON(`./api/v1/engagement/${loadElement.id}`, function(data) {
        _storyID = data[0].story_id;
        _progressSnapshot = JSON.parse(data[0].response);
        _getStorySchema(_storyID, loadElement.id, _progressSnapshot);
      })
      .fail(function(){
        _onStorySchemaFailure();
      })
    }
  }

  function _isStoryIDValid(storyID){
    const IDPattern = /^([A-Z0-9]{10})$/g;

    return IDPattern.test((storyID + "").toUpperCase());
  }

  function _isEngagementIDValid(engagementID){
    const IDPattern = /^([a-z0-9-]{36})$/g;

    return IDPattern.test(engagementID);
  }

  function _onSubmitStoryID(event){
    event.preventDefault();
    _resetUI();

    storyID = event.target[0].value;

    if(_isStoryIDValid(storyID)){
      _getStorySchema(storyID);
    } else {
      _onStorySchemaFailure();
    }
  }

  function _getIDFromURL(){
    let lastPathElement = window.location.pathname.split("/").at(-1);

    if (_isStoryIDValid(lastPathElement)) {
      return {type: "story", id: lastPathElement.toUpperCase()};
    } else if(_isEngagementIDValid(lastPathElement)) {
      return {type: "engagement", id: lastPathElement};
    } else {
      return false;
    }
  }

  function _getStorySchema(storyID, engagementID, progressSnapshot){
    $.getJSON( `./stories/${storyID}/schema.json`, function( data ) {
      _schema = data;
      _setIDs(storyID, engagementID);
      
      if(progressSnapshot){
        _loadStoryProgress(progressSnapshot);
      }

      _initializeStory();
      _loadStep();
    })
    .fail(function(){
      _onStorySchemaFailure();
    });
  }

  function _onFirstLoad(){
    $("#step-welcome").fadeIn(500);
  }

  function _onStorySchemaFailure(){
    $("#step-error").fadeIn(500);
  }

  function _initializeStory(){
    $("#story-label").fadeIn(500).text(_schema.label);
    $("#story-replay").fadeIn(500);
  }

  function _showLoading(container, display){
    $("#step-loading").fadeIn(200).css({display: "flex"});
    $("#step-loading-animation").attr('src', (_firstOpen ? "./img/book_open.gif" : "./img/book_flip.gif"));

    setTimeout(function(){
      $("#step-loading").fadeOut(200, function(){
        $(container).fadeIn(200);

        if(display){
          $(container).css({display: "flex"});
        }
      });
    }, (_firstOpen ? 3000 : 1000));

    _firstOpen = false;
  }

  function _loadStep(){
    $("#step-story").hide();
    $("#step-decision").hide();
    $("#step-input").hide();

    switch(_schema.steps[_getCurrentStep()].type){
      case Types.Story:
        _loadStory();
        break;
      case Types.Decision:
        _loadDecision();
        break;
      case Types.Input:
        _loadInput();
        break;
    }
  }

  function _onSubmitStep(){
    switch(_schema.steps[_getCurrentStep()].type){
      case Types.Story:
        _submitStory();
        break;
      case Types.Decision:
        _submitDecision();
        break;
      case Types.Input:
        _submitInput();
        break;
    }
  }

  function _loadStory(){
    var story = _schema.steps[_getCurrentStep()];

    _showLoading("#step-story");

    var label = $("#step-story-label");
    var text = $("#step-story-text");
    var image = $("#step-story-image");
    var submit = $("#step-story-submit");

    (story.label ? label.show().text(_getConditionValue(story.label)) : label.hide());
    (story.text ? text.show().html(_getConditionValue(story.text)) : text.hide());
    (story.image ? image.show().attr("src", `./stories/${_getStoryID()}/${_getConditionValue(story.image)}`) : image.hide());
    (story.submit ? submit.show().text(_getConditionValue(story.submit)) : submit.hide());
  }

  function _submitStory(){
    let story =  _schema.steps[_getCurrentStep()];

    if (story.persistValue){
      _persistValue(story.persistValue);
    }

    _setCurrentStep(_getConditionValue(story.onSubmitStep));
    _uploadStoryProgress();
    _loadStep();
  }

  function _loadDecision(){
    var decision = _schema.steps[_getCurrentStep()];

    _showLoading("#step-decision", "flex");

    var label = $("#step-decision-label");
    var text = $("#step-decision-text");
    var image = $("#step-decision-image");
    var submit = $("#step-decision-submit");
    var answerLabel = $("#step-decision-answer-label");

    (decision.label ? label.show().text(_getConditionValue(decision.label)) : label.hide());
    (decision.text ? text.show().html(_getConditionValue(decision.text)) : text.hide());
    (decision.image ? image.show().attr("src", `./stories/${_getStoryID()}/${_getConditionValue(decision.image)}`) : image.hide());
    (decision.submit ? submit.show().text(_getConditionValue(decision.submit)).prop('disabled', true) : submit.hide());
    (decision.answer.label ? answerLabel.show().text(_getConditionValue(decision.answer.label)) : answerLabel.hide());

    let options = "";
    decision.answer.options.forEach((option, i) => {
      options += `<div class="col-lg-3 col-md-6"><p option="${i}" class="answer-option mx-1 p-4 lead" onclick="window.document.StoryTime.onSelectOption(event)">`;
      options += (option.image ? `<img class="step-decision-answer-options-image mb-3" src="./stories/${_getStoryID()}/${option.image}" />` : ``);
      options += (option.image && option.label ? `<br />` : ``);
      options += (option.label ? `${option.label}` : ``);
      options += `</p></div>`;
    });
    $("#step-decision-answer-options").html(options);
  }

  function _submitDecision(){
    let decision =  _schema.steps[_getCurrentStep()];
    let selectedOption = $("p.selected-option").attr('option');

    if (!selectedOption){
      return;
    }

    if (decision.answer.options[selectedOption].persistValue){
      _persistValue(decision.answer.options[selectedOption].persistValue);
    }

    _addPoints(decision.answer.options[selectedOption].points);
    _setCurrentStep(_getConditionValue(decision.answer.options[selectedOption].onSubmitStep));
    _uploadStoryProgress();
    _loadStep();
  }

  function _loadInput(){
    var input = _schema.steps[_getCurrentStep()];

    _showLoading("#step-input", "flex");

    var label = $("#step-input-label");
    var text = $("#step-input-text");
    var image = $("#step-input-image");
    var submit = $("#step-input-submit");
    var answerLabel = $("#step-input-answer-label");
    var answerValue = $("#step-input-answer-value");

    (input.label ? label.show().text(_getConditionValue(input.label)) : label.hide());
    (input.text ? text.show().html(_getConditionValue(input.text)) : text.hide());
    (input.image ? image.show().attr("src", `./stories/${_getStoryID()}/${_getConditionValue(input.image)}`) : image.hide());
    (input.submit ? submit.show().text(_getConditionValue(input.submit)).prop('disabled', true) : submit.hide());
    (input.answer.label ? answerLabel.show().text(_getConditionValue(input.answer.label)) : answerLabel.hide());
    (input.answer.placeholder ? answerValue.show().attr("placeholder", _getConditionValue(input.answer.placeholder)).val("") : answerValue.attr("placeholder", "...").val(""));
  }

  function _submitInput(){
    let input =  _schema.steps[_getCurrentStep()];
    let inputValue = $("#step-input-answer-value").val().trim().slice(0,50);

    if (!inputValue){
      return;
    }

    if (input.answer.persistValue){
      _persistValue(input.answer.persistValue, inputValue);
    }

    _addPoints(input.answer.points);
    _setCurrentStep(_getConditionValue(input.answer.onSubmitStep));
    _uploadStoryProgress();
    _loadStep();
  }

  function _onSelectOption(event){
    $("p.selected-option").each((index, item) => {
      $(item).removeClass("selected-option");
    });
    $(event.target).closest(".answer-option").addClass("selected-option");
    $("#step-decision-submit").prop('disabled', false);
  }

  function _onInputChange(event){
    var input = $("#step-input-answer-value");
    var submit = $("#step-input-submit");

    if(input.val().trim() === ""){
      submit.prop('disabled', true);
    } else {
      submit.prop('disabled', false);
    }
  }

  function _persistValue(values, inputValue){
    for (var key in values){
      if(values[key] === "@@INPUT"){
        localStorage.setItem(key, inputValue);
      } else {
        localStorage.setItem(key, _argumentValue(values[key]));
      }
    }
  }

  function _meetsCondition(conditions){
    for (var key in conditions){
      let value = localStorage.getItem(key);

      switch(conditions[key].slice(0,2)){
        case "==":
          return parseInt(value) === parseInt(conditions[key].slice(2));
        case ">=":
          return parseInt(value) >= parseInt(conditions[key].slice(2));
        case "<=":
          return parseInt(value) <= parseInt(conditions[key].slice(2));
      }

      if(value && value === conditions[key]){
        return true;
      }
    }

    return false;
  }

  function _getConditionValue(propertyValue){
    if(propertyValue.constructor !== Array){
      return _argumentValue(propertyValue);
    }

    for (let index = 0; index < propertyValue.length; index++) {
      if(_meetsCondition(propertyValue[index].condition)){
        return _argumentValue(propertyValue[index].value);
      }
    }
  }

  function _argumentValue(value){
    if(value.indexOf("@@") === -1){
      return value;
    }

    var argumentedValue = value.replace(/@@[a-zA-Z0-9]*/g, placeholder => localStorage.getItem(placeholder.slice(2)));
    return argumentedValue;
  }

  function _replayStory(){
    storyID = _getStoryID();
    engagementID = _getEngagementID();
    localStorage.clear();
    _firstOpen = true;

    _uploadStoryProgress(engagementID);
    _getStorySchema(storyID);
  }

  window.document.StoryTime = {
    isStoryIDValid: _isStoryIDValid,
    onSubmitStoryID: _onSubmitStoryID,
    onSubmitStep: _onSubmitStep,
    onSelectOption: _onSelectOption,
    onInputChange: _onInputChange,
    replayStory: _replayStory
  }

  window.onload = function() {
    _initializeApplication();
  };

})();
