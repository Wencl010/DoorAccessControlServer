const fetch = require("node-fetch"); 

const API_URL = "*******";

async function getScheduleRefresh(){
    return await getTokens("*******", "*******");
}

/**
 * Gets new authorization token
 */
async function getAuthToken(refreshToken){
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    const data = {
        "refresh_token" : refreshToken,
        "grant_type": 'refresh_token',
        'client_id': "*******",
    }
    
    let response = await fetch(API_URL + "/authorization/tokens", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
            
    if(response.status == 200){
        response = await response.json();
        return response.token_type+ " " +response.access_token;
    }
    else{
        return null;
    }
}

/**
 * Gets new authorization token
 */
async function getTokens(username, password){
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    const data = {
        "username": username,
        "password": password,
        "grant_type": 'password',
        'client_id': "*******",
        'scope': 'offline_access'
    }
    
    let response = await fetch(API_URL + "/authorization/tokens", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
            
    if(response.status == 200){
        response = await response.json();
        let authToken = response.token_type+ " " +response.access_token;
        return {"refresh": response.refresh_token, "auth": authToken}
    }
    else{
        return null;
    }
}

/**
 * Opens the door for a short period of time, as if a card badged in
 * @param doorID The ID for door you wish to open
 */
async function shortOpen(refreshToken, doorID){
    const token = await getAuthToken(refreshToken);
    const headers = {
        "Content-Type": "application/json",
        "Authorization": token
    }
    const data = {
        'doorId':doorID
    }
    
    let response = await fetch(API_URL + "/commands/door/open", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
    if(response.status == 200){
        return true
    }
    return false
}

/**
 * Sets the door to unlocked 
 * @param doorID The ID for door you wish to open
 */
async function holdOpen(refreshToken, doorID){
    const token = await getAuthToken(refreshToken);
    const headers = {
        "Content-Type": "application/json",
        "Authorization": token
    }
    const data = {
        'doorId':doorID
    }
    
    let response = await fetch(API_URL + "/commands/door/holdOpen", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
    if(response.status == 200){
        return true
    }
    return false
}

/**
 * Sets the door to locked 
 * @param doorID The ID for door you wish to close
 */
async function close(refreshToken, doorID){
    const token = await getAuthToken(refreshToken);
    const headers = {
        "Content-Type": "application/json",
        "Authorization": token
    }
    const data = {
        'doorId':doorID
    }
    
    fetch(API_URL + "/commands/door/close", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });
}

/**
 * Opens the door for a provided period of time
 * @param doorID The ID for door you wish to open
 * @param timeMS The length the door should be open for in Milliseconds
 */
async function timedOpen(refreshToken, doorID, timeMS){
    const token = await getAuthToken(refreshToken);
    const headers = {
        "Content-Type": "application/json",
        "Authorization": token
    }
    const data = {
        'doorId':doorID,
        "RelayFunction": {
            "RelayId": "Relay1",
            "RelayAction": "TimedOpen",
            "RelayOpenTime": timeMS
          },
    }
    
    let response = await fetch(API_URL + "/commands/door/control", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(data),
            });

    if(response.status == 200){
        return true
    }
    return false
}

/**
 * Gets a list of doors
 */
async function get(refreshToken){
    const token = await getAuthToken(refreshToken);
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": token
    }
   
    
    let response = await fetch(API_URL + "/doors", {
                method: "GET",
                headers: headers,
            });
    response = await response.json();
    return response;
}

module.exports = {shortOpen, close, timedOpen, get, getTokens, getScheduleRefresh};