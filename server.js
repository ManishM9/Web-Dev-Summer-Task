var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var session = require("express-session");

var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyCINMJ7Fz3iXWgWuQ9jXyeoqXQ76Grkols",
    authDomain: "web-dev-summer-task.firebaseapp.com",
    databaseURL: "https://web-dev-summer-task.firebaseio.com",
    projectId: "web-dev-summer-task",
    storageBucket: "web-dev-summer-task.appspot.com",
    messagingSenderId: "29792037405"
  };
firebase.initializeApp(config);
var db = firebase.database();

app.use(session({
    secret: 'TereMAAkaBHOsda',
    resave: true,
    saveUninitialized: false,
    authorised: false,
    username: ""
}));


var admin = require("firebase-admin");

var serviceAccount = require("./assets/web-dev-summer-task-firebase-adminsdk-x189t-321e34054b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://web-dev-summer-task.firebaseio.com"
});

var storage = admin.storage();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/assets"));

app.use(bodyparser.urlencoded({extended:false}));


app.get("/", function(req,res){
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    
    if(username !== undefined && authorised === true){
        
        res.redirect("/home");
        
    } else {
        
        res.render("login",{disp:""});
        
    }
    
    
});

app.get("/login", function(req,res){
    res.redirect("/");
});

app.post("/login", function(req,res){
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    
    if(username !== undefined && authorised === true){
        res.redirect("/landing");
    } else {
        
        var username_entered = reqb.username;
        var password_entered = reqb.password;
        
        db.ref("/members/"+username_entered).once("value", function(snapshot){
            
            var val = snapshot.val();
            if(val === null){
                res.render("login",{disp:"Incorrect Username Or Password"});
            } else {
                
                if(val.Password === password_entered){
                    req.session.authorised = true;
                    req.session.username = username_entered;
                    res.redirect("/home");
                } else {
                    res.render("login",{disp:"Incorrect Username Or Password"});
                }
                
            }
            
        });
        
        
        
    }
    
});


app.get("/home", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    
    if(username !== undefined && authorised === true){
        
        res.render("home");
        
    } else {
        res.redirect("/");
    }
    
    
});


app.get("/task1", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    if( username !== undefined && authorised === true){
        res.render("taskupload");
    } else {
        res.redirect("/");
    }
    
});

storage.bucket("web-dev-summer-task.appspot.com").getFiles().then(results => {
            const files = results[0];
            
            console.log("files:");
            files.forEach(file => {
                console.log(file.name);
            });
        }).catch(err =>{
            console.log(err);
        });

app.post("/task1", function(req,res){
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    if( username !== undefined && authorised === true){
        
        storage.bucket().getFiles().then(results => {
            const files = results[0];
            
            console.log("files:");
            files.forEach(file => {
                console.log(file.name);
            });
        }).catch(err =>{
            console.log(err);
        });
        
    }
    
});



app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server Started");
});