const app = require('express')();
const server = require("http").createServer(app);
const bodyParser = require('body-parser');
const cors = require("cors");

const io = require("socket.io")(server,{
    cors:{
        origin:"*",
        method:[ "GET", "POST" ] 
    }
});

app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();


app.get('/',(req,res)=>{
    res.send('Running');
})

//creating a socket ipc for connection to room
io.on('connection', (socket) => {
    console.log("new connection",socket.id);
    socket.on("join-room",(data)=>{
        console.log(data);
        const {email, roomName} = data;
        emailToSocketMap.set(email,socket.id);
        socketToEmailMap.set(socket.id,email);
        io.to(roomName).emit("new-user-joined",{email,id:socket.id});
        socket.join(roomName);
        io.to(socket.id).emit('join-room',data);
    });

    socket.on("user:call",({to,offer})=>{
        io.to(to).emit('incoming:call',{from:socket.id,offer});
    });

    socket.on("call:accepted",({to,ans})=>{
       io.to(to).emit("call:accepted",{from:socket.id, ans});
    })

    socket.on("peer:nego:needed",({to,offer})=>{
        io.to(to).emit("peer:nego:needed",{from:socket.id, offer});
    })

    socket.on("peer:nego:done",({to,ans})=>{
        io.to(to).emit("peer:nego:final",{from:socket.id, ans});
    })

    socket.on("send-msg",(data)=>{
        // io.emit("receive-msg",{message});
        console.log(data);
        socket.broadcast.emit("receive-msg",data);
    })
});

server.listen(PORT,() => console.log(`Server is running on port ${PORT}`));