const net=require('net')
const fs=require('fs')
class Response
{
constructor()
{
this.action="";
this.success=false;
this.error=null;
this.result=null;
}
}
class DataModel
{
constructor()
{
this.users=[]
this.userID=0
}
getUserByUsername(username)
{
var user=this.users.find(function(user){
return user.username==username;
});
return user;
}
getUserByID(id)
{
var user=this.users.find(function(user){
return user.id==id;
});
return user;
}
getLoggedInUsers()
{
var loggedInUsers=[]
for(var e=0;e<this.users.length;e++)
{
if(this.users[e].loggedIn)
{
loggedInUsers.push(this.users[e].username);
}
}
return loggedInUsers;
}
}
var model=new DataModel();
function populateDataStructure()
{
var usersJSONString=fs.readFileSync("users.data","utf-8");
var users=JSON.parse(usersJSONString).users;
users.forEach(function(user){
user.loggedIn=false;
users.id=0;
users.monitorSocket=null;
model.users.push(user);
})
}
function processRequest(requestObject)
{
if(requestObject.action=="send")
{
let message=requestObject.message;
let fromUser=requestObject.fromUser;
let toUser=requestObject.toUser;
let user=model.getUserByUsername(fromUser);
if(user && user.loggedIn && user.monitorSocket)
{
var response=new Response();
response.action=requestObject.action;
response.message=message;
response.fromUser=fromUser; 
user.monitorSocket.write(JSON.stringify(response));
}

user=model.getUserByUsername(toUser);
if(user && user.loggedIn && user.monitorSocket)
{
var response=new Response();
response.action=requestObject.action;
response.message=message;
response.fromUser=fromUser; 
user.monitorSocket.write(JSON.stringify(response));
}
}
if(requestObject.action=="broadcast")
{
let message=requestObject.message;
let fromUser=requestObject.fromUser;
model.users.forEach(function(user){
if(user.loggedIn && user.monitorSocket)
{
var response=new Response();
response.action=requestObject.action;
response.message=message;
response.fromUser=fromUser;
user.monitorSocket.write(JSON.stringify(response));
}
})
}
if(requestObject.action=="createMonitor")
{
let userID=requestObject.userID;
let user=model.getUserByID(userID);
var response=new Response();
response.action=requestObject.action;
if(user)
{
user.monitorSocket=requestObject.socket;
response.result=user.username;
}
else
{
response.result="";
}
requestObject.socket.write(JSON.stringify(response));
}
if(requestObject.action=="login")
{
let username=requestObject.username;
let password=requestObject.password;
let user=model.getUserByUsername(username);
var success=false;
if(user)
{
if(password==user.password) success=true;
}
let response=new Response();
response.action=requestObject.action;
response.success=success;
if(success)
{
response.error="";
model.userID++;
requestObject.socket.userID=model.userID;
user.id=model.userID;
user.loggedIn=true;
response.result={
"username":user.username,
"id":user.id
}
}
else
{
response.error="Invalid username / password";
response.result="";
}
requestObject.socket.write(JSON.stringify(response));
if(success)
{
let username=user.username;
let notificationMessage=username+" has logged in";
var e=0;
while(e<model.users.length)
{
user=model.users[e];
if(user.username!=username && user.loggedIn && user.monitorSocket)
{
response=new Response();
response.action="notification";
response.notificationMessage=notificationMessage;
user.monitorSocket.write(JSON.stringify(response));
}
e++;
}
}
}
if(requestObject.action=="logout")
{
let userID=requestObject.userID;
let user=model.getUserByID(userID);
if(user && user.monitorSocket)
{
var response=new Response();
response.action=requestObject.action;
response.result=model.getLoggedInUsers();
user.monitorSocket.write(JSON.stringify(response));
}
user.loggedIn=false;
user.monitorSocket=null;
user.id=0;
let username=user.username;
let notificationMessage=username+" has logged out";
var e=0;
while(e<model.users.length)
{
user=model.users[e];
if(user.username!=username && user.loggedIn && user.monitorSocket)
{
response=new Response();
response.action="notification";
response.notificationMessage=notificationMessage;
user.monitorSocket.write(JSON.stringify(response));
}
e++;
}


}
if(requestObject.action=="getUsers")
{
let userID=requestObject.userID;
let user=model.getUserByID(userID);
if(user && user.monitorSocket)
{
var response=new Response();
response.action=requestObject.action;
response.result=model.getLoggedInUsers();
user.monitorSocket.write(JSON.stringify(response));
}
}
}
populateDataStructure();
var server=net.createServer(function(socket){
socket.on('data',function(data){
var requestObject=JSON.parse(data);
requestObject.socket=socket;
try
{
processRequest(requestObject);
}catch(e)
{
console.log(e)
}
})
socket.on('end',function(){
console.log('Client closed connection')
})
socket.on('error',function(){
console.log('Some problem at client side')
})
})
server.listen(5500,"localhost");
console.log("Chat server is ready to accept request on port 5500")
