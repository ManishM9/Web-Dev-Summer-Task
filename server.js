var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var session = require("express-session");
var fileUpload = require("express-fileupload");
var fs = require("fs");

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
    username: "",
    email: "",
    year: 0,
    admin: false
}));


var admin = require("firebase-admin");

var serviceAccount = require("./web-dev-summer-task-firebase-adminsdk-x189t-321e34054b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://web-dev-summer-task.firebaseio.com"
});

var storage = admin.storage();

app.set("view engine", "ejs");

app.use(fileUpload());

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
                    req.session.email = val.Email;
                    req.session.year = val.Year;
                    req.session.admin = val.Admin;
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
        
        res.render("home", {username: username});
        
    } else {
        res.redirect("/");
    }
    
    
});


app.get("/task1", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    var admin = req.session.admin;
    if( username !== undefined && authorised === true && admin === undefined){
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix: ""}).then(results =>{
            const file = results[0];
            // console.log(file);
            
            var flag = false;
            file.forEach(fil =>{
                if(fil.name.includes(username+"_task1")){
                    flag = true;
                }
            });
            if(flag){
                // res.render("taskupload", {disp:"You have already uploaded the document, click <a href=\"/download\">here</a> to download."})
                res.render("taskupload", {username: username,disp: true, tno:1});
            } else {
                res.render("taskupload", {username: username,disp: false, tno:1});
            }
            
        });
        
    } else if( username !== undefined && authorised === true && admin === true){
        
        var upload_details = [];
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix: "Task1/"}).then(results =>{
            var files = results[0];
            // console.log(files);
            
            files.forEach(file =>{
                var temp_name = file.name.split("/")[1];
                if(temp_name !== undefined && temp_name !== ""){
                    upload_details.push(temp_name);
                }
                console.log(file.name);
                
            });
            
            // console.log(upload_details);
            
            res.render("taskprogress", {upload_details:upload_details});
            
        }).catch(err =>{
            if(err) throw err;
        });
        
        // res.render("taskprogress");
        
    } else {
        res.redirect("/");
    }
    
});

// storage.bucket("web-dev-summer-task.appspot.com").getFiles().then(results => {
//             const files = results[0];
            
//             console.log("files:");
//             files.forEach(file => {
//                 console.log(file.name);
//             });
//         }).catch(err =>{
//             console.log(err);
//         });

app.post("/task1", function(req,res){
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    if( username !== undefined && authorised === true){
        
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles().then(results =>{
            const file = results[0];
            // console.log(file);
            var filename;
            var flag = false;
            file.forEach(fil =>{
                // console.log(fil);
                if(fil.name.includes(username+"_task1")){
                    flag = true;
                    filename = fil.name;
                    storage.bucket("web-dev-summer-task.appspot.com").file(fil.name).delete().then(() =>{
                        console.log("File deleted");
                    }).catch(err =>{
                        console.log("Error deleting file:"+err);
                    });
                }
            });
            
        });
        
        
        
        var curr_file = req.files.file_uploaded;
        var extension = curr_file.name.split(".")[1];
        var file_name_only = username+"_task1."+extension;
        var file_name = "./TempStorage/"+username+"_task1."+extension;
        // console.log(file_name);
        curr_file.mv("TempStorage/"+username+"_task1."+extension, function(err){
            if(err){
                console.log("Error in moving file "+ file_name+":"+err);
            } else {
                // res.redirect("/task1");
                console.log(file_name_only);
                storage.bucket("web-dev-summer-task.appspot.com").upload(file_name, {destination: "Task1/"+file_name_only}).then(() =>{
                    console.log("Uploaded:"+file_name_only);
                    fs.unlink(file_name, function(err){
                        if(err) throw err;
                        res.redirect("/task1");
                        // console.log("Unlinking Error:"+err);
                    });
                }).catch(err =>{
                    console.log(err);
                    fs.unlink(file_name, function(err){
                        if(err) throw err;
                        res.redirect("/task1");
                        // console.log("Unlinking Error:"+err);
                    });
                });
            }
        });
        
        // storage.bucket("web-dev-summer-task.appspot.com").getFiles().then(results => {
        //     const files = results[0];
            
        //     console.log("files:");
        //     files.forEach(file => {
        //         console.log(file.name);
        //     });
        // }).catch(err =>{
        //     console.log(err);
        // });
        
    } else {
        res.redirect("/");
    }
    
});

app.get("/task1/download", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    
    if(username !== undefined && authorised === true){
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles().then(results => {
            const file = results[0];
            // console.log(file);
            var filename;
            var flag = false;
            file.forEach(fil =>{
                if(fil.name.includes(username+"_task1")){
                    flag = true;
                    filename = fil.name;
                }
            });
            if(flag){
                var extension = filename.split(".")[1];
                storage.bucket("web-dev-summer-task.appspot.com").file(filename).download({destination: "assets/files/"+username+"_task1."+extension}).then(() =>{
                    
                    res.redirect("/files/"+username+"_task1."+extension);
                    
                    setTimeout(function(){
                        fs.unlink("./assets/files/"+username+"_task1."+extension, function(err) {
                            if(err) throw err;
                        });
                    }, 30000);
                    
                }).catch(err =>{
                    if(err) throw err;
                });
                
            }
            
        });
        
    } else {
        res.redirect("/");
    }
    
});


app.get("/task1/:doc_name", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    var admin = req.session.admin;
    var doc_name = req.params.doc_name;
    
    if(username !== undefined && authorised === true && admin === true){
        
        storage.bucket("web-dev-summer-task.appspot.com").file("Task1/"+doc_name).download({destination: "assets/files/"+doc_name}).then(() =>{
            res.redirect("/files/"+doc_name);
            
            setTimeout(() =>{
                fs.unlink("assets/files/"+doc_name, function(err) {
                    if(err) throw err;
                });
            }, 30000);
        });
        
    } else {
        res.redirect("/");
    }
    
    
});

app.get("/task2/:doc_name", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    var admin = req.session.admin;
    var doc_name = req.params.doc_name;
    
    if(username !== undefined && authorised === true && admin === true){
        storage.bucket("web-dev-summer-task.appspot.com").file("Task2/"+doc_name).download({destination: "assets/files/"+doc_name}).then(() =>{
            res.redirect("/files/"+doc_name);
            
            setTimeout(function(){
                fs.unlink("assets/files/"+doc_name, function(err) {
                    if(err) throw err;
                });
            }, 30000);
        });
    } else {
        res.redirect("/");
    }
    
});

app.get("/task2", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    var admin = req.session.admin;
    
    if(username !== undefined && authorised === true && admin === undefined){
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix :"Task2/"}).then(results =>{
            const files = results[0];
            
            var flag = false;
            files.forEach(file =>{
                if(file.name.includes(username+"_task2")){
                    flag = true;
                }
            });
            if(flag){
                res.render("taskup", {username: username, disp: true, tno:2});
            } else {
                res.render("taskup", {username: username, disp: false, tno:2});
            }
        });
        
        
    } else if(username !== undefined && authorised === true && admin === true){
        var upload_details = [];
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix: "Task2/"}).then(results =>{
            var files = results[0];
            
            files.forEach(file =>{
                var temp_name = file.name.split("/")[1];
                if(temp_name !== undefined && temp_name !== ""){
                    upload_details.push(temp_name);
                }
                console.log(file.name);
            });
            
            res.render("taskpr", {upload_details: upload_details, tno:2});
        }).catch(err =>{
            if(err) throw err;
        });
    } else {
        res.redirect("/");
    }
    
});


app.post("/task2", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    var admin = req.session.admin;
    
    if(username !== undefined && authorised === true){
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix: "Task2/"}).then(results =>{
            const files = results[0];
            
            var filename;
            var flag = false;
            files.forEach(file =>{
                if(file.name.includes(username+"_task2")){
                    flag = true;
                    filename = fil.name;
                    storage.bucket("web-dev-summer-task.appspot.com").file(file.name).delete().then(() =>{
                        console.log("File deleted");
                    }).catch(err =>{
                        console.log("Error deleting file:"+err);
                    });
                }
            });
        });
        
        var curr_file = req.files.file_uploaded;
        var extension = curr_file.name.split(".")[1];
        var file_name_only = username+"_task2."+extension;
        var file_name = "./TempStorage/"+username+"_task2."+extension;
        
        curr_file.mv("TempStorage/"+username+"_task2."+extension, function(err){
            if(err){
                console.log("Error in moving file "+file_name+": "+err);
            } else {
                console.log(file_name_only);
                storage.bucket("web-dev-summer-task.appspot.com").upload(file_name, {destination: "Task2/"+file_name_only}).then(() =>{
                    console.log("Uploaded:"+file_name_only);
                    
                    fs.unlink(file_name, function(err) {
                        if(err) throw err;
                        res.redirect("/task2");
                    });
                }).catch(err =>{
                    console.log(err);
                    fs.unlink(file_name, function(err) {
                        if(err) throw err;
                        res.redirect("/task2");
                    });
                });
            }
        });
        
    } else {
        res.redirect("/");
    }
    
});


app.get("/task2/download", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    
    if(username !== undefined && authorised === true){
        
        storage.bucket("web-dev-summer-task.appspot.com").getFiles({prefix: "Task2/"}).then(results =>{
            const files = results[0];
            
            var filename;
            var flag = false;
            files.forEach(file =>{
                if(file.name.includes(username+"_task2")){
                    flag = true;
                    filename = file.name;
                }
            });
            if(flag){
                var extension = filename.split(".")[1];
                storage.bucket("web-dev-summer-task.appspot.com").file(filename).download({destination: "assets/files/"+username+"_task2."+extension}).then(() =>{
                    res.redirect("/files/"+username+"_task2."+extension);
                    
                    setTimeout(function(){
                        fs.unlink("./assets/files/"+username+"_task2."+extension, function(err) {
                            if(err) throw err;
                        });
                    }, 30000);
                }).catch(err =>{
                    if(err) throw err;
                });
            }
        });
        
    } else {
        res.redirect("/");
    }
    
});


app.get("/account", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    
    if(username !== undefined && authorised === true){
        
        res.render("account", {disp: "", username: username, email:email, year:year});
        
    } else {
        res.redirect("/");
    }
    
});

app.post("/pchange", function(req, res) {
    
    var reqb = req.body;
    var username = req.session.username;
    var authorised = req.session.authorised;
    var email = req.session.email;
    var year = req.session.year;
    
    if(username !== undefined && authorised === true){
        
        var curr_pass = reqb.curr_pass;
        var new_pass1 = reqb.new_pass1;
        var new_pass2 = reqb.new_pass2;
        
        db.ref("/members/"+username).once("value", function(snapshot){
            var val = snapshot.val();
            
            if(val === null){
                req.session.destroy();
                res.send("HACKER!!!!");
            } else {
                
                if(val.Password === curr_pass){
                    
                    if(new_pass1 === new_pass2){
                        
                        db.ref("/members/"+username).update({Password: new_pass1}).then(() =>{
                            req.session.destroy();
                            res.send("Password Changed");
                        });
                        
                    } else {
                        res.render("account", {disp: "Confirmation failed due to different new Passwords", username: username, email:email, year:year});
                    }
                    
                } else {
                    res.render("account", {disp: "Invalid current password", username: username, email:email, year:year});
                }
                
            }
        });
        
    } else {
        res.redirect("/");
    }
    
});




app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server Started");
});