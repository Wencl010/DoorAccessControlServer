const http = require('http');
const url = require('url');
const fs = require('fs');
const favicon = require('serve-favicon');
const express = require("express");
const session = require('express-session');
const schedule = require('node-schedule');
const mysql = require("mysql");
const doors = require("./Doors-API.js");
const { exit } = require('process');

let JOB = {};


let database = mysql.createConnection({
    host: "localhost",
    user: "*******",
    password: "*******",
    database: "*******"
});

database.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected to MYSQL database!");

    database.query('SELECT * FROM Schedules;', function(err, result) { 
        if(err) { 
            console.warn(err);
            exit();
        };
        for(let i = 0; i<result.length; i++){
            let oldEntry = deleteOldEntry(result[i]); //Deletes Old Entry From Database and returns true if entry is old

            if(!oldEntry){
                database.query('SELECT doorId FROM ScheduledDoors WHERE scheduleID = ?;', result[i].scheduleId, function(err, doorResult) { 
                    if(err) { 
                        console.warn(err);
                        exit();
                    };

                    let doorArray = [];
                    for(let j=0; j<doorResult.length; j++){
                        doorArray.push(doorResult[j].doorId);
                    }
                    
                    let status = createScheduleInNode(result[i], doorArray);

                    if(status.status == "fail"){//If Error on scheduling command delete schedule database entry & notify user of failure (door table entry is deleted automatically)
                        console.warn("Schedule "+result[i].name +" ["+ result[i].scheduleId+"] failed with message: " + status.message);
                        exit();
                    }

                    console.log("Schedule "+result[i].name +" ["+ result[i].scheduleId+"] loaded");
                }); 
            }
        }
    });


    let rule = new schedule.RecurrenceRule();
    rule.hour = 0;
    rule.minute = 0;
    rule.tz = 'America/Chicago';
    schedule.scheduleJob(rule, function(){
        console.log("Clearing old schedules");
        database.query('SELECT * FROM Schedules;', function(err, result) { 
            if(err) { 
                console.warn(err);
            };
            for(let i = 0; i<result.length; i++){
                deleteOldEntry(result[i]); //Deletes Old Entry From Database and returns true if entry is old
            }
        });
    })
});


const app = express();
const PORT = 80;
app.use(express.json());

/**
 * This function runs at the start of the server to handle all startup processes. 
 */
function startupProcess(){
    console.log((new Date) + "\nDoorAccessServer is started on port " + PORT+"\n");
}

/**
 * This function runs at the shutdown of the server to handle the termination of all processes.
 * TODO: Close SQL Connection
 * TODO: Delete Scheduled events
 */
function shutdownProcess(){
    console.log("Starting server shutdown process");
    
    console.log((new Date) +"\nServer shutdown");
}
process.on( 'SIGINT', function() {
    console.log("\nSIGINT signal recieved");
    shutdownProcess();
    process.exit( );
});
process.on( 'SIGTERM', function() {
    console.log("\nSIGTERM signal recieved");
    shutdownProcess();
    process.exit( );
});


/*************** Server Setup ***************/
app.listen(PORT, startupProcess); //Server is only used to close the connection at the end
app.use(session({
    secret: "*******",
    saveUninitialized: true,
    resave: false
  }
));



/*************** Paths Needed to Login ***************/
app.get('/login.html', function (req, res) {
    let now = new Date();
    if(req.session.token && req.session.expire > now.getTime()){
        res.redirect(303, "/");
        return;
    }
    res.sendFile(__dirname + "/client/html/login.html");
});

app.post('/sendLoginDetails', async function (req, res) {
    let response = await doors.getTokens(req.body.name, req.body.pw);
    if(response == null){
        res.json({status:"fail"});
    }
    else{
        req.session.token = response.refresh;
        let expireTime = new Date();
        expireTime.setHours(expireTime.getHours()+2);
        expireTime.setMinutes(expireTime.getMinutes()-10);
        req.session.expire = expireTime.getTime();
        res.json({status:"success"});
    }    
});

app.use('/css', express.static(__dirname + '/client/css'));

app.use(favicon(__dirname + '/client/img/favicon.ico'));

/****************************** Start of secured paths ******************************/
app.use((req, res, next) => {
    let now = new Date();
    if(req.session.token && req.session.expire > now.getTime()){
        next();
    }
    else{
        res.redirect(303, "/login.html");
        return
    }
})

app.get('/js/refreshHelper.js', function (req, res) {
    let secondToExpire = req.session.expire - (new Date().getTime()); 
    secondToExpire = Math.floor(secondToExpire/1000) + 5;
    let js = "let meta = document.createElement('meta'); meta.setAttribute('HTTP-EQUIV', 'Refresh'); meta.setAttribute('CONTENT', '" + secondToExpire + "'); document.getElementsByTagName('head')[0].appendChild(meta);"
    
    res.send(js);
});

app.use('/js', express.static(__dirname + '/client/js'));
app.use('/page', express.static(__dirname + '/client/html'));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/client/html/home.html")
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect(303, "/login.html");
});

app.get('/getDoors', async function (req, res) {
    let response = await doors.get(req.session.token);
    res.json(response);
});

app.post('/shortOpenDoors', async function (req, res) {
    let errorDoors = [];
    for(let i=0; i<req.body.ids.length; i++){
        if(!(await doors.shortOpen(req.session.token, req.body.ids[i]))){
            errorDoors.push(req.body.ids[i]);
        }
    }

    if(errorDoors.length == 0){
        res.json({status:"success"});
    }
    else{
        res.json({status:"fail", ids:errorDoors});    
    }
});

app.post('/holdOpenDoors', async function (req, res) {
    res.json(await openDoorsFor(req.session.token, req.body.ids, req.body.duration));   
});

app.post('/scheduleDoors', async function (req, res) {
    openStartedEvents(req, res, null, createNewDoorSchedule);
});

app.get('/getSchedules', function (req, res) {
    database.query('SELECT * FROM Schedules;', function(err, result) { 
        if(err) { 
            console.warn(err);
            res.json({status:"fail", message:err});    
        };
        res.json({status:"success", body:result});    
    });
});

app.post('/getSchedule', function (req, res) {

    database.query('SELECT * from Schedules S, ScheduledDoors D WHERE S.scheduleId = D.scheduleId AND D.doorId = ?;',req.body.id, function(err, result) { 
        if(err) { 
            console.warn(err);
            res.json({status:"fail", message:err});    
        };

        res.json({status:"success", body:result});    
    });
});

app.post('/getScheduleDetails', function (req, res) {
    database.query('SELECT * FROM Schedules WHERE scheduleId = ?;', req.body.id, function(err, result) { 
        if(err) { 
            console.warn(err);
            res.json({status:"fail", message:err});    
        };

        database.query('SELECT * FROM ScheduledDoors WHERE scheduleId = ?;', req.body.id, function(err, doorResult) {
            if(err) { 
                console.warn(err);
                res.json({status:"fail", message:err});    
            };
             res.json({status:"success", body:{info:result, doors:doorResult}});  
        });  
    });
});

app.put('/updateDoorSchedule', function (req, res){
    openStartedEvents(req, res, req.body.scheduleId, updateDoorSchedule);
})

app.delete('/deleteSchedule', function (req, res){
    if(req.body.id == null || req.body.id == undefined || req.body.id == ""){
        res.json({status:"fail", message:"Must specify a schedule id to delete"});    
    }
    try{ JOB[req.body.id].cancel() } catch(e){};
    
    database.query("DELETE FROM Schedules WHERE scheduleId = ?", req.body.id, function (err, result){
        if(err){
            console.warn("Schedule ["+ req.body.id+"] could not be deleted with error: " + e);
            res.json({status:"fail", message:"Could not delete schedule with error: " + e});    
        }
        res.json({status:"success"});    
    });
});

// function to return the 404 message and error to client
app.get('*', function(req, res) {
    res.status(404).send('404 Not Found') 
});
  






function formatDataForSQL(data){
    let sqlData = {
        name:null,          // *varchar(40)
        openTime:null,      // *varchar(5)
        duration:null,      // *int (milliseconds)
        oneTime:null,       // *BOOL
        oneTimeDate:null,   //  varchar(10)
        sun:null,           //  BOOL
        mon:null,           //  BOOL
        tue:null,           //  BOOL
        wed:null,           //  BOOL
        thu:null,           //  BOOL
        fri:null,           //  BOOL
        sat:null,           //  BOOL
        firstDate:null,     //  varchar(10)
        lastDate:null       //  varchar(10)
    };

    sqlData.name = data.name;
    sqlData.openTime = data.openTime;
    sqlData.duration = getDurationBetweenTimes(data.openTime, data.closeTime);
    sqlData.oneTime = data.oneTime;
    sqlData.oneTimeDate = data.oneTimeDate;
    sqlData.sun = data.recurring.sun,
    sqlData.mon = data.recurring.mon,
    sqlData.tue = data.recurring.tue,
    sqlData.wed = data.recurring.wed,
    sqlData.thu = data.recurring.thu,
    sqlData.fri = data.recurring.fri,
    sqlData.sat = data.recurring.sat,
    sqlData.firstDate = data.recurring.first;
    sqlData.lastDate = data.recurring.last;

    return sqlData;
}


function getDurationBetweenTimes(open, close){
    // console.log(open + "   ~   "+close);
    let closeHrs = close.split(":")[0];
    let closeMin = close.split(":")[1];

    let openHrs = open.split(":")[0];
    let openMin = open.split(":")[1];

    // console.log(openHrs + "   ~   "+openMin);
    // console.log(closeHrs + "   ~   "+closeMin);


    let duration = 0; //milliseconds

    if(openHrs == closeHrs){
        duration = (closeMin - openMin) * 60 * 1000;  //minutes to milliseconds
    }
    else{
        let minutes = closeMin * 1; //account for time from closeHrs:00 to closeHrs:closeMin
        // console.log(minutes);
        //Account for openHrs:openMin to (openHrs+1):00
        minutes += (60-openMin * 1); 
        // console.log(minutes);

        openHrs++;
        // console.log(openHrs);

        let hours = closeHrs-openHrs;
        // console.log(hours);

        duration = hours*60*60*1000 + minutes*60*1000;
    }

    // console.log(duration);

    if(duration < 0){
        throw "Door Open Duration Can Not Be Less Than 0";
    }
    return duration;
}

async function openDoorsFor(token, doorIds, duration){
    //Opens each requested door for the given time length
    let errorDoors = [];
    for(let i=0; i<doorIds.length; i++){
        if(!(await doors.timedOpen(token, doorIds[i], duration))){
            errorDoors.push(doorIds[i]);
        }
    }
    
    //checks for errors
    if(errorDoors.length == 0){
        return {status:"success"};
    }
    else{
        return {status:"fail", ids:errorDoors}; 
    }
}


function createScheduleInNode(sqlData, doorIds){
    try{
        if(sqlData.oneTime){
            let eventTime = new Date(Date.parse(sqlData.oneTimeDate+"T"+sqlData.openTime+":00.000"));

            JOB[sqlData.scheduleId] = schedule.scheduleJob(eventTime, async function(){
                let tokens = await doors.getScheduleRefresh();
                if(tokens == null){
                    console.warn("Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed to get refresh token.");
                }
                let json = await openDoorsFor(tokens.refresh, doorIds, sqlData.duration);
                if(json.status == "fail"){
                    console.warn("Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed to open doors "+json.ids);
                }
            });
        }
        else{ //Handles Recuring Events
            let rule = new schedule.RecurrenceRule();
            rule.hour = sqlData.openTime.split(":")[0]; //sets rule for when door scheduled to open
            rule.minute = sqlData.openTime.split(":")[1]; //sets rule for when door scheduled to open
            rule.tz = 'America/Chicago';

            //sets recurring rule days of week
            rule.dayOfWeek = [];
            if(sqlData.sun){ rule.dayOfWeek.push(0); }
            if(sqlData.mon){ rule.dayOfWeek.push(1); }
            if(sqlData.tue){ rule.dayOfWeek.push(2); }
            if(sqlData.wed){ rule.dayOfWeek.push(3); }
            if(sqlData.thu){ rule.dayOfWeek.push(4); }
            if(sqlData.fri){ rule.dayOfWeek.push(5); }
            if(sqlData.sat){ rule.dayOfWeek.push(6); }

            let start = new Date(Date.parse(sqlData.firstDate+"T00:01:00.000"))
            let finish = new Date(Date.parse(sqlData.lastDate+"T23:59:00.000"))

            JOB[sqlData.scheduleId] = schedule.scheduleJob({start:start, end:finish, rule:rule}, async function(){
                let tokens = await doors.getScheduleRefresh();
                if(tokens == null){
                    console.warn("Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed to get refresh token.");
                }
                let json = await openDoorsFor(tokens.refresh, doorIds, sqlData.duration);
                if(json.status == "fail"){
                    console.warn("Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed to open doors "+json.ids);
                }
            });
        }
    }catch(e){
        try{
            console.warn("createSchedule for Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed with error: " + e);
        }
        catch(subE){
            console.warn(subE);
            console.warn(e);
        }
        return{status:"fail", message:e};
    }

    return {status:"success"};
}


function deleteOldEntry(sqlData){
    /***** Create Time And Date Strings to check whether the door should already be open *****/
    let todayArr = (new Date().toLocaleString('en-US', { year:"numeric", day: '2-digit', month:"2-digit", timeZone: 'America/Chicago' })) // "09/27/2023"
    todayArr = todayArr.split("/");
    let tmp = todayArr[0];
    todayArr[0] = todayArr[2];
    todayArr[2] = todayArr[1];
    todayArr[1] = tmp;
    todayArr = todayArr.join("-");


   // let time = new Date().toLocaleString('en-US', { hour: '2-digit', minute:"2-digit", hour12:false, timeZone: 'America/Chicago' });
    /********************************************************************************************/

    if((sqlData.oneTime && sqlData.oneTimeDate < todayArr) || //Checks for old single day events
       (!sqlData.oneTime && sqlData.lastDate < todayArr)){ //Checks for old multiday events

        database.query("DELETE FROM Schedules WHERE scheduleId = ?", sqlData.scheduleId, function (err, result){
            if(err){
                console.warn("Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] could not be deleted with error: " + e);
            }
        });

        return true;
    }
    return false;
}


async function openStartedEvents(req, res, id, continuationFunc){
    /***** Create Time And Date Strings to check whether the door should already be open *****/
    let todayArr = (new Date().toLocaleString('en-US', { year:"numeric", day: '2-digit', month:"2-digit", timeZone: 'America/Chicago' })) // "09/27/2023"
    todayArr = todayArr.split("/");
    let tmp = todayArr[0];
    todayArr[0] = todayArr[2];
    todayArr[2] = todayArr[1];
    todayArr[1] = tmp;
    todayArr = todayArr.join("-");


    let time = new Date().toLocaleString('en-US', { hour: '2-digit', minute:"2-digit", hour12:false, timeZone: 'America/Chicago' });
    /********************************************************************************************/

    if(req.body.oneTime && req.body.oneTimeDate == todayArr && req.body.openTime < time){//Handles already started Single Day Events
        /* Handles Events that are for today and should already be open *
         * These events don't need a schedule or database entry and are *
         * instead handled the same way as the timed hold open unlocks  */     

        let duration = getDurationBetweenTimes(time, req.body.closeTime);  //gets the time in milliseconds from now until door should close

        res.json(await openDoorsFor(req.session.token, req.body.doors, duration));   
    }
    else{
        let curDayWeek = new Date().toLocaleString('en-US', { weekday:'long', timeZone: 'America/Chicago' }).toLowerCase().slice(0,3);
        if(!req.body.oneTime && req.body.recurring.first <= todayArr && req.body.openTime < time && req.body.closeTime > time && req.body.recurring[curDayWeek] ){//Handles multiday Events that started in the past
             /* Handles multiday events that occur today and should already be open *
              * The first occourence of these events don't need a schedule. After   *
              * opening it for today the database entry and schedule will be built  *
              * as usual.  */     

            let duration = getDurationBetweenTimes(time, req.body.closeTime);  //gets the time in milliseconds from now until door should close

            openDoorsFor(req.session.token, req.body.doors, duration)
        }


        continuationFunc(res, req, id)

    
        
    }
}

function createNewDoorSchedule(res, req, id){
    //Adds request information to the schedule database
    let sqlData = formatDataForSQL(req.body);

    database.query('INSERT Schedules SET ?;', sqlData, function(err, result) { 
        if(err) { 
            console.log(err)
            res.json({status:"fail", message:err});    
        };

        sqlData.scheduleId = result.insertId;
       
        //adds the requestId (autogenerated by the database when adding the request to it) to each door id
        let doorData = [...req.body.doors];
        for(let i = 0; i<doorData.length; i++){
            doorData[i] = [result.insertId, doorData[i]];
        }

        //Adds the door ids and linked request informtation to the door schedule database
        database.query('INSERT INTO ScheduledDoors (scheduleId, doorId) VALUES ?;', [doorData], function(err, result) {
            if(err) { //If Error on creating link between doors and schedule delete schedule database entry & notify user of failure
                console.log(err);
                database.query("DELETE FROM Schedules WHERE scheduleId = ?",[sqlData.scheduleId], function(err, result) { if(err) { console.log(err); }})

                res.json({status:"fail", message:err});   
                return;
            };


            let status = createScheduleInNode(sqlData, req.body.doors)

            if(status.status == "fail"){//If Error on scheduling command delete schedule database entry & notify user of failure (door table entry is deleted automatically)
                database.query("DELETE FROM Schedules WHERE scheduleId = ?",[sqlData.scheduleId], function(err, result) { if(err) { console.log(err); }})
                res.json(status);   
                return;
            }

            res.json({status:"success"}); 
        });
    });
}

function updateDoorSchedule(res, req, id){
    //Adds request information to the schedule database
    let sqlData = formatDataForSQL(req.body);

    try{JOB[id].cancel();}catch(e){console.warn("Job cancel for Schedule "+sqlData.name +" ["+ sqlData.scheduleId+"] failed with error: " + e)};

    database.query('UPDATE Schedules SET ? WHERE scheduleId = ?;', [sqlData, id], function(err, result) { 
        if(err) { 
            console.log(err)
            res.json({status:"fail", message:err});    
        };

        sqlData.scheduleId = result.insertId;
       
        //adds the requestId (autogenerated by the database when adding the request to it) to each door id
        let doorData = [...req.body.doors];
        for(let i = 0; i<doorData.length; i++){
            doorData[i] = [id, doorData[i]];
        }

        database.query('DELETE FROM ScheduledDoors WHERE scheduleId = ?;', [id], function(err, result) {
            if(err) { 
                console.log(err);
                res.json({status:"fail", message:err});   
                return;
            };
            //Adds the door ids and linked request informtation to the door schedule database
            database.query('INSERT INTO ScheduledDoors (scheduleId, doorId) VALUES ?;', [doorData], function(err, result) {
                if(err) {
                    console.log(err);
                    res.json({status:"fail", message:err});   
                    return;
                };

                let status = createScheduleInNode(sqlData, req.body.doors)

                if(status.status == "fail"){
                    res.json(status);   
                    return;
                }

                res.json({status:"success"});
            });
        });
    });
}
