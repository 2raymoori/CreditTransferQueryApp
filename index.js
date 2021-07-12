const express = require('express');
const { Db } = require('mongodb');
// const {MongoClient} = require("mongodb");
const mongoClient = require('mongodb');
const app = express();
app.use(express.json())

app.use(
  express.urlencoded({
    extended: true
  })
)
// setting public folder
app.use(express.static("public"));
// Setting the default view 
app.set("view engine","ejs");
app.set("views","/home/qcellswat/Documents/Qcell/Credit_Transfer_Monitor/views");
// app.set("views","/var/www/Credit_Transfer_Monitor/views");
app.use(express.static(__dirname + '/public'));
app.post("/home",(req,res)=>{
  console.log(req.body);
  res.render("pages/home")
})
app.get("/about",(req,res)=>{
  res.render("pages/about");
})
app.use("/",require("./Controller/recSearch"))
app.listen(3001,()=>{
  console.log(`Server listening on port 3001`);
})
