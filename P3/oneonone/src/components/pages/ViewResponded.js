import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../App.css';

// currently the calendar is hard coded at 3 and the editing user is user 4
// need to change to get calendar associated with login user etc.

export default function FillInCalendar(){
    const navigate = useNavigate();
    const handleSubmit = () => navigate('/FillInCalendar', { replace: false });
    // const testSelectProducts = () => navigate('/testPage', { replace: false });

    // holds api availability data
    const [availablilties, setAvailabilities] = useState([]);
    // calendar in the form to display
    const [displayCalendarSeparated, setDisplayCalendarSeparated] = useState([]);
    // array of a column of time slots for calendar
    const [timeSlots, setTimeSlots] = useState([]);
    // variables to be used in calculations
    const [startDateGlobal, setStartDateGlobal] = useState("");
    const [startTimeGlobal, setStartTimeGlobal] = useState("");
    // calendar to edit
    const [editCal, setEditCal] = useState([]);
    // preference for selection of slots
    const [editPref, setEditPref] = useState("high");
    // hold api invited data
    const [invList, setInvList] = useState([]);
    // invited data in the form to display
    const [invDisp, setInvDisp] = useState([]);

    // create calendar arrays from api
    useEffect(() => {
        axios.get('http://localhost:8000/api/calendar/3/')
            .then(response => {
                var tempArr = []
                var start_time = response.data.start_time;
                var start_hour = parseInt(start_time.split(":")[0], 10);
                var end_time = response.data.end_time;
                var end_hour = parseInt(end_time.split(":")[0], 10);
                var num_slots = end_hour - start_hour;
                setStartTimeGlobal(start_hour)

                var startDateString = response.data.start_date;
                setStartDateGlobal(startDateString)
                var endDateString = response.data.end_date;
                var startDate = new Date(startDateString);
                var endDate = new Date(endDateString);
                var differenceInMs = endDate - startDate;
                var num_days = (differenceInMs / (1000 * 60 * 60 * 24)) + 1;

                for(var i = 0; i < num_days+1; i++){
                    for(var j = 0; j < num_slots; j++){
                        if(i == 0){
                            var time = (j + start_hour) % 12;
                            if (time == 0){time = 12}
                            var tempStr = time + ":00 - " + (time+1) + ":00";
                            tempArr.push(tempStr);
                        } else{
                            var tempStr = "blank";
                            tempArr.push(tempStr);
                        }
                    }            
                }
                var temp = [];
                var temp2 = [];
                var newArr = [];
                var newArrayEdit = [];

                for(let i = 0; i < tempArr.length; i = i + num_slots){
                    for(let j = 0; j < num_slots; j++){
                        temp.push([tempArr[i+j], 0, 0]) 
                        temp2.push([tempArr[i+j], 0, 0])                               
                    }
                    newArr.push(temp);
                    newArrayEdit.push(temp2);
                    temp = [];
                    temp2 = [];
                }

                var tempSliceDisplay = newArr.slice(1);
                newArrayEdit = newArrayEdit.slice(1);
                setDisplayCalendarSeparated(tempSliceDisplay);
                setEditCal(newArrayEdit);
                setTimeSlots(newArr[0]);
                console.log("successfully extracted calendar");
            })
            .catch(error => {
            console.log(error);
            });
        }, []);

    // grab availabilities from api
    useEffect(() => {
    axios.get('http://localhost:8000/api/calendar/3/availabilities/')
        .then(response => {
        setAvailabilities(response.data);
        })
        .catch(error => {
        console.log(error);
        });
    }, []);

    // grab all invited users to a calendar
    useEffect(() => {
        axios.get('http://localhost:8000/api/calendar/3/invited/')
            .then(response => {
            setInvList(response.data);
            })
            .catch(error => {
            console.log(error);
            });
        }, []);

    // generate the calendar with availabilities, generate invited contacts
    //const generateCalendar = () => {
    useEffect(() => {
        // update calendar for each availablilty
        if(availablilties.length == 0){return}
        if(invList.length == 0){return}
        for(let i = 0; i < availablilties.length; i++){
            let start = availablilties[i].start_time;
            let avDate = ""

            avDate = start.substring(0, 10)
            avDate = new Date(avDate);
            if(startDateGlobal == ""){break}

            let startDateGlobaltemp = new Date(startDateGlobal)
            let differenceInMs = avDate - startDateGlobaltemp;
            // how far from the start date it is
            let dayIndex = Math.round(differenceInMs / (1000 * 60 * 60 * 24));

            let timeIndex = 0;

            start = parseInt(start.substring(11, 13));
            timeIndex = start - startTimeGlobal

            let pref = false;
            let user = 0;
            let prefClass = "blank";
            if(typeof availablilties[i].preference === undefined){ continue } else{
                pref = availablilties[i].preference;
                if(pref) {prefClass = "high"} else {prefClass = "low"}
                user = availablilties[i].user;
            }

            // console.log(displayCalendarSeparated);

            if(displayCalendarSeparated.length < 1){return}
            var dispCopy = displayCalendarSeparated;

            var id = availablilties[i].id;

            dispCopy[parseInt(dayIndex)][parseInt(timeIndex)] = [prefClass, user, id]; 
            setDisplayCalendarSeparated(dispCopy);
            console.log("generated availabilities");
        }
        // generate contacts into a form to display
        console.log(invList);
        var InvDispTemp = [];
        for(let d = 0; d < invList.length; d++){
            InvDispTemp.push([invList[d].invUser, invList[d].id, invList[d].answered])
        }
        setInvDisp(InvDispTemp);
    //};
    }, [availablilties, displayCalendarSeparated, startDateGlobal, startTimeGlobal, invList]);

    const dateToDay = (date) => {
        let i = date;
        if (i == 0){return("Monday")}
        else if (i == 1){return("Tuesday")}
        else if (i == 2){return("Wednesday")}
        else if (i == 3){return("Thursday")}
        else if (i == 4){return("Friday")}
        else if (i == 5){return("Saturday")}
        else if (i == 6){return("Sunday")}
        else {console.log("error in dateToDay")}
    }

    const handlePref = () => {
        if(editPref == "high"){
            setEditPref("low")
        } else {
            setEditPref("high")
        }
    }

    const handleAddContact = () => {
        return
    }

    const handleDeleteContact = (contactID) => {
        axios({
            method: 'delete',
            url: 'http://localhost:8000/api/invited/' + contactID +"/",
            data: {}                
        });
    }

    return (
        <div>
            <button onClick={handlePref}>update</button>
            <h1>Current Responses</h1>
            <div className="display-calendar">
                <div className="time-column">
                    <h4>Time</h4>
                    {timeSlots?.map((item2, idx2) => (
                        <div key={idx2} className="blank">{item2[0]}</div>
                    ))}
                </div>
                {displayCalendarSeparated?.map((inner2, index2) => (
                    <div key={index2} className="time-column">
                        <h4>{dateToDay(index2)}</h4>
                        {inner2.map((time2, idx2) => (
                            <div key={idx2} className={time2[0]}>.</div>
                        ))}
                    </div>
                ))}
            </div>  
            <div className="invited-contacts">
                {invDisp?.map((item2, idx2) => (
                        <div key={idx2} className="contact">
                            <h3>{item2[0]}</h3>
                            {item2[2]
                                ? <p>user has already responded</p>
                                : <button>send reminder</button>
                            }
                            <button onClick={() => handleDeleteContact(item2[1])}>remove from invited</button>
                        </div>
                ))}
            </div>
            <button onClick={handleAddContact}>add contact</button>
            <button>generate possible schedules</button>
            <button onClick={handleSubmit}>go to fill in calendar page</button>          
        </div>
    );
}