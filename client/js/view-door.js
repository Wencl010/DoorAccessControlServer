

window.onload = async function(){ 
    await ds_Initialize();

    let rows = document.getElementsByClassName("doorCheckboxCell");

    for(let i=0; i<rows.length; i++){
        let id = rows[i].firstChild.id.split("-")[1];
        let name = rows[i].nextSibling.firstChild.innerText;

        let edit =  document.createElement("button");
        edit.classList.add("scheduleButton");
        edit.classList.add("button");
        edit.innerText = "View";
        edit.onclick = function() {window.location.href = "/page/door.html?id="+id+"&name="+name;};

        rows[i].innerHTML = "";
        rows[i].append(edit);
    }
};
