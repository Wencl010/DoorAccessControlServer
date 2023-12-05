function initialize(){
    let doorId = null;
    let param = window.location.search 
    let idLoc = param.indexOf("id");
    if(idLoc != -1){
        let amp =  param.indexOf("&", idLoc); 
        if(amp != -1){
            doorId = param.slice(idLoc+3,amp); 
        }
        else{
            doorId = param.slice(idLoc+3);
        }
    }

    let name = "";
    let nameLoc = param.indexOf("name");
    if(nameLoc != -1){
        let amp =  param.indexOf("&", nameLoc); 
        if(amp != -1){
            name = param.slice(nameLoc+5,amp); 
        }
        else{
            name = param.slice(nameLoc+5);
        }
    }
    name = name.replaceAll("%20", " ")

    let requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id:doorId})
    };

    fetch('/getSchedule', requestOptions).then(x => x.json()).then(schedulesJson => _loadSchedules(schedulesJson.body));

    window.onload = function (){
        document.getElementById("doorName").innerText += name;
    }
}

function _loadSchedules(schedules){
    console.log(schedules);
    console.log(schedules.length)
    let checkBoxContainer = document.getElementById("scheduleTable");

    for(let i=0; i<schedules.length; i++){
        let row = document.createElement("tr");

        let name = document.createElement("td");
        name.classList.add("name");
        name.classList.add("data");
        name.innerText = schedules[i].name;
        name.setAttribute("label", "Name")
        row.appendChild(name);


        let times = convertTimes(schedules[i]);
        let open = document.createElement("td");
        open.setAttribute("label","Open At");
        open.classList.add("data");
        open.innerText = times.openTime; 
        row.appendChild(open);

        let close = document.createElement("td");
        close.innerText = times.closeTime; 
        close.classList.add("data");
        close.setAttribute("label", "Close At");
        row.appendChild(close);


        let frequency = document.createElement("td");
        frequency.innerText = "One Time"; 
        frequency.setAttribute("label", "Frequency");
        frequency.classList.add("data");

        let first = document.createElement("td");
        first.innerHTML = schedules[i].oneTimeDate;
        first.setAttribute("label", "First Date");
        first.classList.add("data");

        let last = document.createElement("td");
        last.innerHTML = "";
        last.setAttribute("label", "Last Date");
        last.classList.add("data");

        let repeatOn = document.createElement("td");
        repeatOn.innerHTML = "";
        repeatOn.setAttribute("label", "Active Days");
        repeatOn.classList.add("data");
        
        if(!schedules[i].oneTime){
            frequency.innerText = "Recurring"; 
            first.innerHTML = schedules[i].firstDate;
            last.innerHTML = schedules[i].lastDate;
            repeatOn.innerHTML = _toWeekString(schedules[i]);
        }
        row.appendChild(frequency);
        row.appendChild(first);
        row.appendChild(last);
        row.appendChild(repeatOn);

        let buttonCell = document.createElement("td");
        let edit =  document.createElement("button");
        edit.classList.add("edit");
        edit.classList.add("scheduleButton");
        edit.classList.add("button");
        edit.innerText = "Edit";
        edit.onclick = function() {window.location.href = "/page/scheduleDoors.html?id="+schedules[i].scheduleId};
        buttonCell.appendChild(edit);

        let deleteButton =  document.createElement("button");
        deleteButton.classList.add("delete");
        deleteButton.onclick = function() {requestDelete(schedules[i].name, schedules[i].scheduleId)};

        deleteButton.classList.add("scheduleButton");
        deleteButton.classList.add("button");
        deleteButton.innerText = "Delete";
        buttonCell.appendChild(deleteButton);
        row.appendChild(buttonCell);

        checkBoxContainer.appendChild(row);
    }

    if(schedules.length == 0){
        let row = document.createElement("tr");
        let noSchedules = document.createElement("td");
        noSchedules.setAttribute('colspan', 8);
        noSchedules.innerText = "No schedules found";
        row.appendChild(noSchedules);
        checkBoxContainer.appendChild(row);
    }

    document.getElementById("loader-container").remove();
}

function _toWeekString(scheduleData){
    let string = "";

    if(scheduleData.sun){ string += "S" } else{ string += "_"};
    if(scheduleData.mon){ string += "M" } else{ string += "_"};
    if(scheduleData.tue){ string += "T" } else{ string += "_"};
    if(scheduleData.wed){ string += "W" } else{ string += "_"};
    if(scheduleData.thu){ string += "T" } else{ string += "_"};
    if(scheduleData.fri){ string += "F" } else{ string += "_"};
    if(scheduleData.sat){ string += "S" } else{ string += "_"};

    return string;
}

function convertTimes(scheduleData){
    let open24 = scheduleData.openTime;
    let openHrs = open24.split(":")[0];
    let openMin = open24.split(":")[1];

    openMin = (openMin * 1);
    openHrs = (openHrs * 1);

    //Calculate the duration in hours and minutes
    let fullDurMin = (scheduleData.duration / 1000) / 60;
    let durMin = Math.floor(fullDurMin % 60);
    let durHrs = Math.floor(fullDurMin / 60);

    //calculate closing time in 24hr format based on duration
    let closeMin = openMin + durMin;
    let closeHrs = openHrs + durHrs;
    if(closeMin >= 60){
        closeMin = closeMin - 60;
        closeHrs = closeHrs + 1;
    }



    //convert to 12 hr format
    let times = {openTime:"", closeTime:""};
    let openAM_PM = "AM";
    let closeAM_PM = "AM";

    if(openHrs > 12){
        openHrs = openHrs - 12;
        openAM_PM = "PM";
    }
    else if(openHrs == 12){
        openAM_PM = "PM";
    }
    else if(openHrs == 0){
        openHrs = 12;
    }
    if(openHrs < 10){//Pad single digit numbers
        openHrs = "0".concat(openHrs)
    }
    if(openMin < 10){
        openMin = "0".concat(openMin)
    }
    times.openTime = openHrs + ":" + openMin + " " + openAM_PM; 


    if(closeHrs > 12){
        closeHrs = closeHrs - 12;
        closeAM_PM = "PM";
    }
    else if(closeHrs == 12){
        closeAM_PM = "PM";
    }
    else if(closeHrs == 0){
        closeHrs = 12;
    }
    if(closeHrs < 10){
        closeHrs = "0".concat(closeHrs)
    }
    if(closeMin < 10){
        closeMin = "0".concat(closeMin)
    }
    times.closeTime = closeHrs + ":" + closeMin + " " + closeAM_PM; 

    return times;
}

function requestDelete(name, id){
    if(confirm('Are you sure you want to delete the schedule '+name+'?')) {
        let requestOptions = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id:id})
        };

        fetch('/deleteSchedule', requestOptions).then(x => x.json()).then(response => {
            if(response.status == "success"){
                alert("Schedule Sucessfully Deleted");
                location.reload();
            }
            else{
                alert("Deletion failed, Please try again. Schedule is still active");
                loaderOverlay.classList.add("hidden");
            }
        });
    }
}

initialize();
