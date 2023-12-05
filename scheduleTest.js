const schedule = require('node-schedule');

let nextId = 1200;

let job = {};



function createScheduleInNode(sqlData, doorIds){

    if(sqlData.oneTime){
        let eventTime = new Date(Date.parse(sqlData.oneTimeDate+"T"+sqlData.openTime+":00.000"));

        job[sqlData.scheduleId] = schedule.scheduleJob(eventTime, function(){
            console.log(sqlData.duration);
            console.log(doorIds);
            //TODO SEND OPEN COMMAND
        });
        nextId++;
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

        job[sqlData.scheduleId] = schedule.scheduleJob({start:start, end:finish, rule:rule}, function(){
            console.log(sqlData.duration);
            console.log(doorIds);
            //TODO SEND OPEN COMMAND
        });
        nextId++;
    }
}



// createScheduleInNode({hour:13, minute:41}, [700,701,702]);
// createScheduleInNode({hour:13, minute:42}, [800,801,802]);
// createScheduleInNode({hour:13, minute:43}, [900,901,902]);

// job[1201].cancel();
 
// let rule = new schedule.RecurrenceRule();
// rule.hour = 10;
// rule.minute = 41;
// rule.tz = 'America/Chicago';

// let x = "2023-09-28";
// let s = "13:01";
// let f = "14:12";

// let start = new Date(Date.parse(x+"T"+s+":00.000")) //this for one times
// let finish = new Date(Date.parse(x+"T23:59:00.000"))
// console.log(start.toLocaleString('en-US',{timeZone: 'America/Chicago' }))
// job[nextId] = schedule.scheduleJob({start:start, end:finish, rule:rule}, function(){
//     console.log(6);
// });


let sqlData ={
    scheduleId: 1,
    name: "Test",
    openTime: "12:35",
    duration: 1000,
    oneTime: 0,
    oneTimeDate: "2023-09-28",
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    firstDate: "2023-09-28",
    lastDate: "2023-09-30",
}

sqlData.scheduleId++;
sqlData.thu = 0;
createScheduleInNode(sqlData, ["test5"]);
sqlData.scheduleId++;
sqlData.thu = 1;
createScheduleInNode(sqlData, ["test6"]);
job[3].cancel();


sqlData ={
    scheduleId: 1,
    name: "Test",
    openTime: "12:31",
    duration: 1000,
    oneTime: 0,
    oneTimeDate: "2023-09-28",
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    firstDate: "2023-09-29",
    lastDate: "2023-09-30",
}

sqlData.firstDate = "2023-09-25";
sqlData.lastDate = "2023-09-26";
sqlData.openTime = "12:36",

createScheduleInNode(sqlData, ["test8"]);