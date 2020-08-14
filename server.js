const app =  require('./app');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peerServer);

const port = process.env.PORT || 3030;

server.listen(port,async ()=> {
    console.log(`running port ${port}`)
});

io.on('connection',socket=>{ 
    socket.on('join-room',(roomId,userId)=>{
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected',userId);

        
        socket.on('message',data=>{
            io.to(roomId).emit('message',data);
        })

        socket.on('typing',author=>{
            io.to(roomId).emit('typing',author);
        })

        socket.on('disconnect',()=>{
            socket.to(roomId).broadcast.emit('user-disconnected',userId);
        })
    });
});
