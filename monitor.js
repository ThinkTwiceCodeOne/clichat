const net=require('net')
const events=require('events')
class DataModel
{
constructor()
{
this.user=null;
}
}
class Request
{
constructor()
{
this.action="";
}
}
var model=new DataModel();
var eventEmitter=new events.EventEmitter();
var client=null;

function loggedOut()
{
console.log(`User ${model.username} logged out`);
process.exit(0)
}
function usersListArrived(users)
{
console.log('List of online users')
for(var e=0;e<users.length;e++)
{
console.log(users[e]);
}
}
function monitorCreated(username)
{
model.username=username;
console.log('This is the Monitor for user : '+username)
}
function monitorDenied()
{
console.log('Unable to create monitor as id is invalid :'+model.id);
process.exit(0);
}
function messageArrived(fromUser,message)
{
console.log(fromUser+'>'+message)
}
function broadcastArrived(fromUser,message)
{
console.log("Broadcast from "+fromUser+">"+message);
}
function notificationArrived(notification)
{
console.log('Notification -- >'+notification);
}
eventEmitter.on('loggedOut',loggedOut)
eventEmitter.on('usersListArrived',usersListArrived);
eventEmitter.on('monitorCreated',monitorCreated);
eventEmitter.on('monitorDenied',monitorDenied);
eventEmitter.on('broadcastArrived',broadcastArrived);
eventEmitter.on('messageArrived',messageArrived);
eventEmitter.on('notificationArrived',notificationArrived);
model.id=process.argv[2];
client=new net.Socket;
client.connect(5500,"localhost",function(){
console.log("Connected to chat server");
let request=new Request();
request.action='createMonitor';
request.userID=model.id;
client.write(JSON.stringify(request));
})
client.on('data',function(data){
var response=JSON.parse(data);
if(response.action=="createMonitor") 
{
if(response.result!=null && response.result.length>0)
{
eventEmitter.emit('monitorCreated',response.result);
}
else
{
eventEmitter.emit('monitorDenied');
}
}
if(response.action=="notification") eventEmitter.emit('notificationArrived',response.notificationMessage);
if(response.action=="broadcast") eventEmitter.emit('broadcastArrived',response.fromUser,response.message);
else if(response.action=="logout") eventEmitter.emit('loggedOut');
else if(response.action=="getUsers") eventEmitter.emit('usersListArrived',response.result);
else if(response.action=="send") eventEmitter.emit('messageArrived',response.fromUser,response.message);
})
client.on('end',function(){});
client.on('error',function(){});
