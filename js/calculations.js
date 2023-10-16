(function(){
    function _meetsCondition(response, conditions){
        let validation = true;

        for(let condition of Object.keys(conditions)){
            if(response[condition] !== conditions[condition]){
                validation = false;
                return validation;
            }
        }

        return validation;
    }

    function _getAverageOfValue(value, engagements){
        let sum = 0, count = 0;

        for(let engagement of engagements){
            let response = JSON.parse(engagement.response) || {};

            if(response[value]){
                sum += parseInt(response[value]);
                count++;
            }
        }

        return {"count": count, "value": sum / count};
    }

    function _getCountPerCategory(value, categories, engagements){
        let output = {}, count = 0;

        for(let engagement of engagements){
            let response = JSON.parse(engagement.response) || {};

            if(response[value]){
                count++;
                
                if(categories.includes(response[value])){
                    output[response[value]] = output[response[value]] + 1 || 1; 
                }
            }
        }

        return {"count": count, "values": output};
    }

    function _getCountForValue(values, engagements, condition){
        let output = {};

        for(let engagement of engagements){
            let response = JSON.parse(engagement.response) || {};

            for(let value of Object.keys(values)){
                if(response[value]){
                    output[value] = output[value] || {};
                    output[value].total = output[value].total + 1 || 1;

                    if(response[value] === values[value] && _meetsCondition(response, condition)){
                        output[value].matches = output[value].matches + 1 || 1;
                    }
                    
                }
            }
        }

        return output;
    }

    window.document.StoryTimeCalculations = {
        getAverageOfValue: _getAverageOfValue,
        getCountPerCategory: _getCountPerCategory,
        getCountForValue: _getCountForValue
    }
})();