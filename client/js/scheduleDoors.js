

window.onload = async function(){ 
    await ds_Initialize();

    const NOW = new Date();
    const CUR_YEAR = NOW.getFullYear();
    const CUR_MONTH = NOW.getMonth() + 1;
    const CUR_DATE = NOW.getDate();
    let curMinutes = NOW.getMinutes();
    if(curMinutes < 10){
        curMinutes = "0"+curMinutes;
    }
    let curHours = NOW.getHours();
    if(curHours < 10){
        curHours = "0"+curHours;
    }
    const CUR_TIME = curHours + ":" + curMinutes;

    let scheduleId = null;
    let param = window.location.search 
    let idLoc = param.indexOf("id");
    if(idLoc != -1){
        let amp =  param.indexOf("&", idLoc); 
        if(amp != -1){
            scheduleId = param.slice(idLoc+3,amp); 
        }
        else{
            scheduleId = param.slice(idLoc+3);
        }
    }

    document.getElementById("openDoors").addEventListener('submit', (event) => {
        event.preventDefault();
        let loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.classList.remove("hidden");

        let answers = getFormAnswers();
        console.log(answers);
        
        if(answers.doors.length == 0){
            ds_CustomAlert("Please select at least 1 door");
            loaderOverlay.classList.add("hidden");
            return;
        }
        if(answers.name == ""){
            ds_CustomAlert("Please enter a schedule name.");
            loaderOverlay.classList.add("hidden");
            return;
        }
        if(answers.openTime == ""){
            ds_CustomAlert("Please enter an opening time.");
            loaderOverlay.classList.add("hidden");
            return;
        }
        if(answers.closeTime == ""){
            ds_CustomAlert("Please enter a closing time.");
            loaderOverlay.classList.add("hidden");
            return;
        }
        if(answers.openTime >= answers.closeTime){
            ds_CustomAlert("The open time must be before the close time.");
            loaderOverlay.classList.add("hidden");
            return;
        }
        if(answers.oneTime == null){
            ds_CustomAlert("System Error, please refresh page and try again.");
            loaderOverlay.classList.add("hidden");
            return;
        }
        else if(answers.oneTime){
            if(answers.oneTimeDate == ""){
                ds_CustomAlert("Please enter an event date.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            let answerDateArr = answers.oneTimeDate.split("-");
            // year -> answerDateArr[0]; month -> answerDateArr[1]; day -> answerDateArr[2];
            if(  answerDateArr[0] < CUR_YEAR ||
                (answerDateArr[0] == CUR_YEAR &&  answerDateArr[1] < CUR_MONTH) ||
                (answerDateArr[0] == CUR_YEAR &&  answerDateArr[1] == CUR_MONTH && answerDateArr[2] < CUR_DATE)
            ){
                ds_CustomAlert("Please select an event date in the future.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(answerDateArr[0] == CUR_YEAR && answerDateArr[1] == CUR_MONTH && answerDateArr[2] == CUR_DATE && answers.closeTime <= CUR_TIME){
                ds_CustomAlert("Error: Event date & closing time combination is in the past.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(answerDateArr[0] > CUR_YEAR + 1){
                ds_CustomAlert("Events can only be scheduled one year in the future.");
                loaderOverlay.classList.add("hidden");
                return;
            }
        }
        else if(!answers.oneTime){
            let rec = answers.recurring;
            if(!rec.sun && !rec.mon && !rec.tue && !rec.wed && !rec.thu && !rec.fri && !rec.sat){
                ds_CustomAlert("Please select at least 1 weekday.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(rec.first == ""){
                ds_CustomAlert("Please enter a date for the first occurence of the event.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(rec.last == ""){
                ds_CustomAlert("Please enter a date for the last occurence of the event.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(rec.last < rec.first){
                ds_CustomAlert("Error: The last date of the event cannot be before the first date of the event.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(rec.last == rec.first){
                ds_CustomAlert("Error: The dates of the first and last occurences of the event are the same. For single day events please select one time for event frequency.");
                loaderOverlay.classList.add("hidden");
                return;
            }

            let answerDateArr = rec.last.split("-");
            // year -> answerDateArr[0]; month -> answerDateArr[1]; day -> answerDateArr[2];
            if(  answerDateArr[0] < CUR_YEAR ||
                (answerDateArr[0] == CUR_YEAR &&  answerDateArr[1] < CUR_MONTH) ||
                (answerDateArr[0] == CUR_YEAR &&  answerDateArr[1] == CUR_MONTH && answerDateArr[2] < CUR_DATE)
            ){
                ds_CustomAlert("Please select a last occurence date in the future.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(answerDateArr[0] == CUR_YEAR && answerDateArr[1] == CUR_MONTH && answerDateArr[2] == CUR_DATE && answers.closeTime <= CUR_TIME){
                ds_CustomAlert("Error: Event's last occurence date & closing time combination is in the past.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            if(answerDateArr[0] > CUR_YEAR + 1){
                ds_CustomAlert("Events can only be scheduled one year in the future.");
                loaderOverlay.classList.add("hidden");
                return;
            }
            
        }


       
        if(scheduleId == null || scheduleId == ""){
            let requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            };

            fetch('/scheduleDoors', requestOptions).then(x => x.json()).then(response => {
                if(response.status == "success"){
                    ds_CustomAlert("Doors Sucessfully Scheduled");
                    window.location.href = "/"
                }
                else{
                    ds_CustomAlert("Door Scheduling Failed, Please Try Again");
                    loaderOverlay.classList.add("hidden");
                }
            });
        }
        else{
            answers.scheduleId = scheduleId;
            let requestOptions = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            };

            fetch('/updateDoorSchedule', requestOptions).then(x => x.json()).then(response => {
                if(response.status == "success"){
                    ds_CustomAlert("Doors Sucessfully Scheduled");
                    history.back();
                }
                else{
                    ds_CustomAlert("Door Scheduling Failed, Please Try Again");
                    loaderOverlay.classList.add("hidden");
                }
            });
        }
        
    });

    document.getElementById("oneTime").addEventListener('change', updateDisplayedQuestions);
    document.getElementById("recurring").addEventListener('change', updateDisplayedQuestions);

    document.getElementById("openDoors").addEventListener('reset', (event) => {
        document.getElementById("recurringQuestions").classList.add("hidden");
        document.getElementById("oneTimeQuestions").classList.remove("hidden");
    });

    if(scheduleId != null && scheduleId != ""){
        let loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.classList.remove("hidden");

        let requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id: scheduleId})
        };

        fetch('/getScheduleDetails', requestOptions).then(x => x.json()).then(response => loadResponse(response.body));

        document.getElementById("clear-button").classList.add("hidden");
        document.getElementById("submit-button").style.marginLeft = "auto";
        document.getElementById("submit-button").innerText = "Update Schedule";
    }
};

function updateDisplayedQuestions(event){
    let target = event.target.id;
    
    if(target == "recurring"){
        document.getElementById("oneTimeQuestions").classList.add("hidden");
        document.getElementById("recurringQuestions").classList.remove("hidden");
    }
    else{
        document.getElementById("recurringQuestions").classList.add("hidden");
        document.getElementById("oneTimeQuestions").classList.remove("hidden");
    }
}

function getFormAnswers(){
    let answers = {};
    answers.doors = ds_getChecked();
    answers.name = document.getElementById("name").value;
    answers.openTime = document.getElementById("open").value;
    answers.closeTime = document.getElementById("close").value;
    
    if(document.getElementById("oneTime").checked && !document.getElementById("recurring").checked){
        answers.oneTime = true;
    }
    else if(!document.getElementById("oneTime").checked && document.getElementById("recurring").checked){
        answers.oneTime = false;
    }
    else{
        answers.oneTime = null;
    }

    answers.oneTimeDate = document.getElementById("oneTimeDate").value;

    answers.recurring = {sun:false, mon:false, tue:false, wed:false, thu:false, fri:false, sat:false};
    if(document.getElementById("sun").checked){
        answers.recurring.sun = true;
    }
    if(document.getElementById("mon").checked){
        answers.recurring.mon = true;
    }
    if(document.getElementById("tue").checked){
        answers.recurring.tue = true;
    }
    if(document.getElementById("wed").checked){
        answers.recurring.wed = true;
    }
    if(document.getElementById("thu").checked){
        answers.recurring.thu = true;
    }
    if(document.getElementById("fri").checked){
        answers.recurring.fri = true;
    }
    if(document.getElementById("sat").checked){
        answers.recurring.sat = true;
    }

    answers.recurring.first = document.getElementById("startDate").value;
    answers.recurring.last = document.getElementById("endDate").value;

    return answers
}

function loadResponse(response){
    response.info = response.info[0];

    let convertClosingTime = function (open, duration){
        let openHrs = open.split(":")[0];
        let openMin = open.split(":")[1];

        openMin = (openMin * 1);
        openHrs = (openHrs * 1);

        //Calculate the duration in hours and minutes
        let fullDurMin = (duration / 1000) / 60;
        let durMin = Math.floor(fullDurMin % 60);
        let durHrs = Math.floor(fullDurMin / 60);

        //calculate closing time in 24hr format based on duration
        let closeMin = openMin + durMin;
        let closeHrs = openHrs + durHrs;
        if(closeMin >= 60){
            closeMin = closeMin - 60;
            closeHrs = closeHrs + 1;
        }

        if(closeHrs < 10){
            closeHrs = "0".concat(closeHrs)
        }
        if(closeMin < 10){
            closeMin = "0".concat(closeMin)
        }

        return closeHrs + ":" + closeMin;
    };

    let loaderOverlay = document.getElementById("loader-overlay");
    loaderOverlay.classList.add("hidden");

    document.getElementById("name").value = response.info.name;
    document.getElementById("open").value = response.info.openTime;
    document.getElementById("close").value = convertClosingTime(response.info.openTime, response.info.duration);

    if(response.info.oneTime){
        document.getElementById("oneTime").checked = true;
        document.getElementById("recurring").checked = false;
        document.getElementById("oneTimeDate").value = response.info.oneTimeDate;
    }
    else{
        document.getElementById("oneTime").checked = false;
        document.getElementById("recurring").checked = true;
        document.getElementById("recurringQuestions").classList.remove("hidden");
        document.getElementById("oneTimeQuestions").classList.add("hidden");

        if(response.info.sun){ document.getElementById("sun").checked = true; }
        else{ document.getElementById("sun").checked = false; }

        if(response.info.mon){ document.getElementById("mon").checked = true; }
        else{ document.getElementById("mon").checked = false; }

        if(response.info.tue){ document.getElementById("tue").checked = true; }
        else{ document.getElementById("tue").checked = false; }

        if(response.info.wed){ document.getElementById("wed").checked = true; }
        else{ document.getElementById("wed").checked = false; }

        if(response.info.thu){ document.getElementById("thu").checked = true; }
        else{ document.getElementById("thu").checked = false; }

        if(response.info.fri){ document.getElementById("fri").checked = true; }
        else{ document.getElementById("fri").checked = false; }

        if(response.info.sat){ document.getElementById("sat").checked = true; }
        else{ document.getElementById("sat").checked = false; }

        document.getElementById("startDate").value = response.info.firstDate;
        document.getElementById("endDate").value = response.info.lastDate;
    }

    for(let i =0; i<response.doors.length; i++){
        document.getElementById("doorCheckBox-"+response.doors[i].doorId).checked = true;
    }
    ds_updateNumCheckedText();
}
