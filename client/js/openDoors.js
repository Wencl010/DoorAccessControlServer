

window.onload = function(){ 
    ds_Initialize();

    document.getElementById("openDoors").addEventListener('submit', (event) => {
        event.preventDefault();
        let loaderOverlay = document.getElementById("loader-overlay");
        loaderOverlay.classList.remove("hidden");

        let doorsArray =  ds_getChecked();
        
        if(doorsArray.length == 0){
            ds_CustomAlert("Please select at least 1 door");
            loaderOverlay.classList.add("hidden");
        }
        else{
            let requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 'ids': doorsArray })
            };

            fetch('/shortOpenDoors', requestOptions).then(x => x.json()).then(response => {
                if(response.status == "success"){
                    ds_CustomAlert("Open Door Command Sucessful");
                    window.location.href = "/"
                }
                else{
                    ds_CustomAlert("Open Door Command Failed, Please Try Again");
                    loaderOverlay.classList.add("hidden");
                }
            });
        }
    });
};
