function _loadDoors(doors){
    let checkBoxContainer = document.getElementById("doorCheckboxFields");

    for(let i=0; i<doors.length; i++){
        let input = document.createElement("input");
        input.setAttribute("type", "checkbox");   
        input.setAttribute("id", "doorCheckBox-"+doors[i].id);     
        input.setAttribute("name", "doorId");
        input.classList.add("checkbox");
        input.setAttribute("value", doors[i].id);

        let label = document.createElement("label");
        label.setAttribute("for", "doorCheckBox-"+doors[i].id); 
        label.innerText = doors[i].name;

        let row = document.createElement("tr");
        let column1 =  document.createElement("td");
        column1.classList.add("doorCheckboxCell");
        let column2 =  document.createElement("td");

        column1.appendChild(input);
        column2.appendChild(label);

        row.appendChild(column1);
        row.appendChild(column2);


        checkBoxContainer.appendChild(row);
    }

    document.getElementById("loader-container").remove();
}

function ds_getChecked(){
    let checkBoxes = document.getElementById("doorCheckboxFields").getElementsByClassName("checkbox");
    let doorsArray = [];
    for(let i=0; i<checkBoxes.length;i++){
        if(checkBoxes[i].checked){
            doorsArray.push(checkBoxes[i].getAttribute("value"))
        }
    }
    return doorsArray
}

async function ds_Initialize(){ 
    let response = await fetch('/getDoors');
    response = await response.json();
    _loadDoors(response);


    document.getElementById("openDoors").addEventListener('change', ds_updateNumCheckedText);

    document.getElementById("openDoors").addEventListener('reset', (event) => {

        let numberText = document.getElementById("numSelected");
        
        numberText.innerText = "*0 doors selected"
        numberText.classList.add("red");
    });
};

function ds_CustomAlert(txt){
    //TODO: Create Custom Alerts
    alert(txt);
}

function ds_updateNumCheckedText(event){
    let numChecked =  ds_getChecked().length;

    let numberText = document.getElementById("numSelected");
    
    numberText.innerText = "*"+numChecked+" doors selected"
    
    if(numChecked == 0){
        numberText.classList.add("red");
    }
    else{
        numberText.classList.remove("red");
    }
}