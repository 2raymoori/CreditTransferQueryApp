const express = require('express');
const Router = express.Router();
const mongodb = require('mongodb');

Router.get("/transferes/:sDate/:eDate/:pno/:type",async (req,res)=>{
  const {sDate,eDate,pno,type} = req.params; // FETCHING DATA FROM THE FORM

  console.error(pno+">>>>>>>>>>>>>>>>");
  console.error(eDate+">>>>>>>>>>>>>>>>");
  console.error(sDate+">>>>>>>>>>>>>>>>");
  let filterValYear = "";
  let pValid = 1; // to determine if phone is valid.
  let client = mongodb.MongoClient; // INIT MONGO CLIENT
  let conHandle = await client.connect("mongodb://10.223.24.4:27017/",{ useNewUrlParser: true,useUnifiedTopology: true });
  let senderList = [];
  let amountList = [];
  let tDateList = [];
  let flags = [];
  let tIds = [];
  let receiverList = [];
  let strMani = "";
  let exceedPeriod = -1; // This is to indicate if the given period is more than 31 days or not. 
  if(!eDate || !sDate){
    res.render("pages/transferRes",{
     "error":"Sorry Both Start date and end date must be specified..."
    })
  }
  if(sDate && eDate){
    // [ '2021', '07', '01' ] date format
    let sDateVal = sDate.split("-"); // Getting individual section of the start date;
    let eDateVal = eDate.split("-"); /// getting individual section of the end date;
    let watch = 1; 

    let startDateYear = sDateVal[0];
    let endDateYear = eDateVal[0];
    let daysCount = eDateVal[2] - sDateVal[2];
    filterValYear = `daily_transfer_cdr_${startDateYear}`;
    let dbHandle = conHandle.db(filterValYear);

    // BEST CASE SCENARIO. MONTH AND YEAR THE SAME. 
    if( !(Number((pno.substring(0,1)) == 3 || Number(pno.substring(0,1))== 5) && pno.length ==7) ){
        pValid = 0;// 
        console.log("Sorry The Phone to query must be a valid qcell number");
    }
    else if(startDateYear === endDateYear && eDateVal[1] === sDateVal[1]){
      let tracker = Number(sDateVal[2]);
      for(let i = 1; i<=daysCount+1; i++){
          if(tracker <= 9){
            tracker = `0${tracker}`;
          }
          console.log(tracker+" : Tracker ");
          // GETTING ALL COLLECTIONS FOR THE SPECIFIED PERIOD. 
          let collections = dbHandle.collection(`cdrs_${startDateYear}${sDateVal[1]}${tracker}`); 
          if(type === "in"){ 
            console.log("Transfer In...");
            await collections.find({"pri_identity":`220${pno}`,"transfer_type":0}).forEach(async (e)=>{
           
              senderList.push(e.pri_identity.substring(3));
              console.log(e.pri_identity.substring(3));
              tDateList.push(e.created_at); // ADD DATE AND TIME UPON FOUND
              flags.push(e.transfer_type)
              amountList.push(e.transfer_amt/1000000); 
              tIds.push(e.transfer_trans_id);
             
           
            watch=1;
          });
          }else if(type ==="out"){
            console.log("Transfer Out...");
            await collections.find({"pri_identity":`220${pno}`,"transfer_type":1}).forEach(async (e)=>{
           
              senderList.push(e.pri_identity.substring(3));
              console.log(e.pri_identity.substring(3));
              tDateList.push(e.created_at); // ADD DATE AND TIME UPON FOUND
              flags.push(e.transfer_type)
              amountList.push(e.transfer_amt/1000000); 
              tIds.push(e.transfer_trans_id);
             
           
            watch=1;
          });

          }
          else{
            console.log("Transfer All...");

          await collections.find({"pri_identity":`220${pno}`}).forEach(async (e)=>{
           
            senderList.push(e.pri_identity.substring(3));
            console.log(e.pri_identity.substring(3));
            tDateList.push(e.created_at); // ADD DATE AND TIME UPON FOUND
            flags.push(e.transfer_type)
            amountList.push(e.transfer_amt/1000000); 
            tIds.push(e.transfer_trans_id);
           
         
          watch=1;
        });
          }
          tracker++;
      }
      
      for(let i = 0; i<tIds.length; i++){
        console.log(`currTID ${tIds[i]}`)
        let date = tDateList[i].split(" ")[0].split("-");
          let collection2 = dbHandle.collection(`cdrs_${date[0]}${date[1]}${date[2]}`);
           await collection2.find({"transfer_trans_id":tIds[i]}).forEach(x=>{
             if(x.pri_identity !== `220${pno}`){
               strMani=x.pri_identity.substring(3);
               console.log(strMani+"//////////////////////////////////////")
               receiverList.push(strMani);
             }

             console.log("********************** About to add "+strMani+"*********************************");
            //  receiverList.push(strMani);
             console.log(strMani+">>>>>>>>>>>>"+x.transfer_date+" : "+x.transfer_amt);
             watch++;
         });
         watch = 1;
      }
    }
    else if(startDateYear === endDateYear && eDateVal[1] != sDateVal[1] ){
        let startMonth = Number(sDateVal[1]);
        let endMonth = Number(eDateVal[1]);
        let startDay = Number(sDateVal[2]);
        let endDay = Number(eDateVal[2]);
        let iterateCount = endMonth - startMonth;
         let remainingDays = 0;
         let runTime = 0;
        let tracker = startDay;
        if(startMonth <=9){
          startMonth = "0"+startMonth;
        }
        switch(startMonth){
          case  "04":case "06": case "09": case 11:

             remainingDays = 1+(30 - startDay);
             runTime = remainingDays + endDay;
            if(iterateCount >1 || runTime > 31){
              exceedPeriod = 1;
            }else{
              for(let i = 1; i<=runTime; i++){
                if(tracker <=9){
                  tracker ="0"+tracker;
                }
                let collections = await dbHandle.collection(`cdrs_${startDateYear}${startMonth}${tracker}`);
                  await collections.find({"pri_identity":`220${pno}`}).forEach(async (e)=>{
                  console.log("Found Something...");
                  senderList.push(e.pri_identity.substring(3));
                  tDateList.push(e.created_at);
                  flags.push(e.transfer_type)
                  amountList.push(e.transfer_amt/1000000);
                  tIds.push(e.transfer_trans_id);
                   console.log("Receiver: "+strMani);
                 watch=1;
                 console.log("Found Something...");
                })
                console.log(startMonth +":"+tracker);

                if(tracker == 30){
                  if(startMonth <=9 ){
                 startMonth ="0"+ ++startMonth;
                  }else{
                    startMonth =++startMonth;
                  }
                  tracker = 0;
                }
                tracker++;
              }
              for(let i = 0; i<tIds.length; i++){
                let date = tDateList[i].split(" ")[0].split("-");
                  let collection2 = dbHandle.collection(`cdrs_${date[0]}${date[1]}${date[2]}`);
                   await collection2.find({"transfer_trans_id":tIds[i]}).forEach(x=>{
                     if(x.pri_identity !== `220${pno}`){
                       strMani=x.pri_identity.substring(3);
                       receiverList.push(strMani);
                     }
                     watch++;
                 });
                 watch = 1;
              }
            }
            break;
            // CASE TO HANDLE FOR QUERIES STARTING WITH FEBURARY AS A MONTH.
            case "02":
            console.log("You are now in case 2");
            if(iterateCount >1 || runTime > 31){
              exceedPeriod = 1;
              console.error("Sorry... To Avoid CPU Overhead, Kindly run a 30 days query period.Thank you.")
            }else{
               remainingDays = 1+(30 - startDay);
               runTime = remainingDays + endDay;
              let flag = 1;
              // CHECK IF THE CURRENT YEAR IS A LEAP YEAR 
            if((startDateYear % 4 === 0 && startDateYear %100 !=0) || (startDateYear % 400 ===0 && startDateYear %100 ===0)){
              remainingDays = 1+(29 - startDay);
              runTime = remainingDays + endDay;
              flag = 0; // zero means its a leap year.
              }else{
                remainingDays = 1+(28 - startDay);
                runTime = remainingDays + endDay;
              }
              // ITERATING OVER THE RANGE PERIOD TO GET DATA.
              for(let i = 1; i<=runTime; i++){
                if(tracker <=9){
                  tracker ="0"+tracker;
                }
                let collections = await dbHandle.collection(`cdrs_${startDateYear}${startMonth}${tracker}`);
                  await collections.find({"pri_identity":`220${pno}`}).forEach(async (e)=>{
                  console.log("Found Something...");
                  senderList.push(e.pri_identity.substring(3));
                  tDateList.push(e.created_at);
                  flags.push(e.transfer_type)
                  amountList.push(e.transfer_amt/1000000);
                  tIds.push(e.transfer_trans_id);
                   console.log("Receiver: "+strMani);
                 watch=1;
                 console.log("Found Something...");
                })
                console.log(startMonth +":"+tracker);
                if(flag == 0){
                 if(tracker == 29){
                  startMonth ="0"+ ++startMonth;
                  tracker = 0;
                 }
                }
                else if(flag == 1){
                  if(tracker == 28){
                    startMonth ="0"+ ++startMonth;
                    tracker = 0;
                  }
                }
                tracker++;
              }
              for(let i = 0; i<tIds.length; i++){
                let date = tDateList[i].split(" ")[0].split("-");
                  let collection2 = dbHandle.collection(`cdrs_${date[0]}${date[1]}${date[2]}`);
                   await collection2.find({"transfer_trans_id":tIds[i]}).forEach(x=>{
                     if(x.pri_identity !== `220${pno}`){
                     //if(watch == 2){
                       strMani=x.pri_identity.substring(3);
                       receiverList.push(strMani);
                     }
                     watch++;
                 });
                 watch = 1;
              }
            }
            break;
            // HANDLING CASES WHERE MONTH ENDING IN 31 DAYS...
          default:
             remainingDays = 1+(31 - startDay);
             runTime = remainingDays + endDay;
            if(iterateCount >1 || runTime > 31){
              exceedPeriod = 1;
              console.error("Sorry... To Avoid CPU Overhead, Kindly run a 30 days query period.Thank you.")
            }
            else{
              for(let i = 1; i<=runTime; i++){
                if(tracker <=9){
                  tracker ="0"+tracker;
                }
                let collections = await dbHandle.collection(`cdrs_${startDateYear}${startMonth}${tracker}`);
                  await collections.find({"pri_identity":`220${pno}`}).forEach(async (e)=>{
                  console.log("Found Something...");
                  senderList.push(e.pri_identity.substring(3));
                  tDateList.push(e.created_at);
                  flags.push(e.transfer_type)
                  amountList.push(e.transfer_amt/1000000);
                  tIds.push(e.transfer_trans_id);
                   console.log("Receiver: "+strMani);
                 watch=1;
                 console.log("Found Something...");
                })
                console.log(startMonth +":"+tracker);

                if(tracker == 31){
                  if(startMonth <=9 ){
                 startMonth ="0"+ ++startMonth;
                  }else{
                    startMonth =++startMonth;
                  }
                  tracker = 0;
                }
                tracker++;
              }
              for(let i = 0; i<tIds.length; i++){
                let date = tDateList[i].split(" ")[0].split("-");
                  let collection2 = dbHandle.collection(`cdrs_${date[0]}${date[1]}${date[2]}`);
                   await collection2.find({"transfer_trans_id":tIds[i]}).forEach(x=>{
                     if(x.pri_identity !== `220${pno}`){
                       strMani=x.pri_identity.substring(3);
                       receiverList.push(strMani);
                     }
                     watch++;
                 });
                 watch = 1;
              }
            }
        }

    }
  }
  return res.status(200).send({
    sDate:sDate,
    eDate:eDate,
    pno:pno,
    pValid:pValid,
    exceedPeriod:exceedPeriod,
    tDateList:tDateList,
    amountList:amountList,
    receiverList:receiverList,
    senderList:senderList,
    tIds:tIds,
    flags:flags
  });
  res.render("pages/transferRes",{
    sDate:sDate,
    eDate:eDate,
    pno:pno,
    pValid:pValid,
    exceedPeriod:exceedPeriod,
    tDateList:tDateList,
    amountList:amountList,
    receiverList:receiverList,
    senderList:senderList,
    tIds:tIds,
    flags:flags
  })
})
Router.get("/",(req,res)=>{
  res.render("pages/formFilter");
})
module.exports = Router;