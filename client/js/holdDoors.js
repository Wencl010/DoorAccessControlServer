

window.onload = function(){ 
    ds_Initialize();

    document.getElementById("openDoors").addEventListener('submit', (event) => {
        event.preventDefault();
        let loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.classList.remove("hidden");

        let doorsArray =  ds_getChecked();

        let holdMs = getHoldDuration();

        
        if(doorsArray.length == 0){
            ds_CustomAlert("Please select at least 1 door");
            loaderOverlay.classList.add("hidden");
        }
        else if(holdMs == 0){
            ds_CustomAlert("Please specify a time greater than 0");
            loaderOverlay.classList.add("hidden");
        }
        else{
            let requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 'ids': doorsArray, 'duration': holdMs})
            };

            fetch('/holdOpenDoors', requestOptions).then(x => x.json()).then(response => {
                if(response.status == "success"){
                    ds_CustomAlert("Hold Door Command Sucessful");
                    window.location.href = "/"
                }
                else{
                    ds_CustomAlert("Hold Door Command Failed, Please Try Again");
                    loaderOverlay.classList.add("hidden");
                }
            });
        }
    });
};

function getHoldDuration(){
    let hours = document.getElementById("hrs").value;
    let mins = document.getElementById("min").value;
    let secs = document.getElementById("sec").value;

    //convert to ms
    return hours*60*60*1000 + mins*60*1000 + secs*1000

}