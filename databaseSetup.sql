 CREATE DATABASE doorAccess;

 CREATE TABLE Schedules (
    scheduleId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(40) NOT NULL,
    openTime VARCHAR(5) NOT NULL,
    duration INT NOT NULL,
    oneTime BOOL NOT NULL,
    oneTimeDate VARCHAR(10),
    sun BOOL,
    mon BOOL,
    tue BOOL,
    wed BOOL,
    thu BOOL,
    fri BOOL,
    sat BOOL,
    firstDate VARCHAR(10),
    lastDate VARCHAR(10),

    PRIMARY KEY (scheduleId)
);

CREATE TABLE ScheduledDoors (
    scheduleId INT NOT NULL,
    doorId INT NOT NULL,

    PRIMARY Key (scheduleId,doorId),
    FOREIGN KEY (scheduleId) REFERENCES Schedules(scheduleId) ON DELETE CASCADE
);



