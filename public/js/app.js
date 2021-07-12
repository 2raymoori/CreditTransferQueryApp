let formHandle = document.getElementById("formSbt");
formHandle.onsubmit =()=>{
  let spinnerImg = document.getElementById("spinner");
  let errSec = document.getElementById("errSec");
  let errMsg = document.getElementById("errMsg");
  let startDateHandle = document.getElementById("sdate");
  let endDateHandle = document.getElementById("edate");
  let pnoHandle = document.getElementById("pno");
  let tType = document.getElementById("tType").value;

  errSec.style.display="none";

  
  let startDate = startDateHandle.value;
  let endDate = endDateHandle.value;
  let pno = pnoHandle.value;
if( !(Number((pno.substring(0,1)) == 3 || Number(pno.substring(0,1))== 5) && pno.length ==7) ){
 errSec.style.display = "block";
 errMsg.innerHTML =("Sorry The Phone to query must be a valid qcell number");
}
else{
spinnerImg.style.display="block";
// fetch(`http://10.223.24.12:3001/transferes/${startDate}/${endDate}/${pno}/${tType}`)
// fetch(`http://localhost:3001/transferes?startDate=${startDate}&endDate=${endDate}&phone=${pno}`)
fetch(`http://localhost:3001/transferes/${startDate}/${endDate}/${pno}/${tType}`)
.then((resp)=>resp.json()).then(function(data){
spinnerImg.style.display="none";
console.log(`Sender List Tracker... ${data.senderList.length}`);
console.log(data);
if(data.exceedPeriod == 1){
    errMsg.innerHTML ="Sorry... To Avoid CPU Overhead, Kindly run a 30 days query period.Thank you.";
 errSec.style.display = "block";
}
else if(data.senderList.length == 0){
errMsg.innerHTML =`SORRY THERE IS NO TRANSFER FOR THIS NUMBER ${pno} BETWEEN THE ABOVE MENTIONED PERIOD.<br />
Thank you. `;

errSec.style.display = "block";

}
else{
let tableData = "<table data-vertable='ver6'>"+
      "<thead>"+
        "<tr class='row100 head'>"+
          "<th class='column100 column1' data-column='column8'>TId</th>"+
          "<th class='column100 column2' data-column='column8'>Sender</th>"+
          "<th class='column100 column3' data-column='column8'>REceiver</th>"+
          "<th class='column100 column4' data-column='column8'>Amount Sent (D)</th>"+
          "<th class='column100 column5' data-column='column8'>Transaction Date</th>"+
          "<th class='column100 column6' data-column='column8'>Status</th>"+
        "</tr>"+
      "</thead>"+
      "<tbody>";

         for(var i = 0; i<data.senderList.length; i++) {
tableData+="<tr class='row100'>";
tableData+=`<td class='column100 column1' data-column='column1' >${data.tIds[i]}</td>`;
tableData+="<td class='column100 column2' data-column='column2'>"
    if(data.flags[i] ===0 ){
      tableData+=`${data.receiverList[i]}`; 
    }else{
        tableData+=`<b><u>${data.senderList[i]}</u></b>`;
    }
tableData+="</td>";
tableData+="<td class='column100 column3' data-column='column3'>"
    if(data.flags[i] == 0 ){
      tableData+=`<b><u>${data.senderList[i]}</u></b>`;
    }else{
        tableData+=`${data.receiverList[i]}`; 
    }
tableData+="</td>";
  tableData+=`<td class='column100 column4' data-column='column4'>${data.amountList[i]} </td>`;
  tableData+=`<td class='column100 column5' data-column='column5'>${data.tDateList[i]} </td>`;
  tableData+="<td class='column100 column6' data-column='column6'>";
      if(data.flags[i] == 0 ){
      tableData+="Transfer in";
      }else{
        tableData+="Transfer Out";
      }
  tableData+="</td>";
tableData+="</tr>";
}

      tableData+="</tbody>";
   tableData+=" </table>";
      let rSection = document.getElementById("rightSec");
      rSection.innerHTML=tableData;
      rSection.style.display="block";
}
// Later remove pValid from the response data

})
.catch((e)=>{

  console.error(e);
})
}
  console.log(`Start Date: ${startDate} , End Date: ${endDate}, Phone: ${pno}`);
  console.log("Form Submitting");
  return false;
}