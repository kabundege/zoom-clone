const socket  = io('/');
const videoGrid = document.querySelector('#video-grid')
const myvideo = document.createElement('video');

myvideo.muted = true;

const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
  });

const peers = {};

myPeer.on('open',id=>{
    socket.emit('join-room',RoomId,id);
})

socket.on('user-disconnected',userId=>{
    const sender = 'a participant 🙋'
    socket.emit('message',{sender,message: ' left '});
    if(peers[userId]) peers[userId].close();
})
 
let myVideoStream;

const handlerPeer = async (stream)=>{
    myVideoStream = stream;
        
    addVideo(myvideo,stream);
    
    myPeer.on('call',call=>{
        call.answer(stream);
        const video = document.createElement('video');
        video.setAttribute('controls','true');

        call.on('stream',userStream=>{
            addVideo(video,userStream);
        })
    });

    socket.on('user-connected',userId=>{
        connetNewUser(userId,stream);
    });
}

// share screen

const shareScreen = () =>{
    document.location.href = `https://rdaconnect.herokuapp.com/${RoomId}?sharescreen=true`; 
}

//////

document.addEventListener('DOMContentLoaded',()=>{
    setInterval(()=>document.querySelector('#typerEvent').textContent ='',3000)

    navigator.mediaDevices.getUserMedia({
        audio:true,video:true
    }).then(stream => handlerPeer(stream));
})

//////////

const connetNewUser = (userId,stream) =>{
    const call = myPeer.call(userId,stream);
    
    const video = document.createElement('video')
    video.setAttribute('controls','true')

    call.on('stream',userStream=>{
        addVideo(video,userStream);
    })

    document.querySelector('#newUserAudio').play()

    call.on('close',()=> {
        video.remove()
    })

    peers[userId] = call;
}

const addVideo = (video,stream) =>{
    video.srcObject = stream;
    video.addEventListener('loadedmetadata',()=>{
        video.play();
    })
    videoGrid.append(video);
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
}
  
const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}
  
const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}
  
const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}
  
const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

const leaveMeeting = () => {
    if(confirm('Leave meeting')){
        socket.emit('disconnect');
    }
}

let visibility = true

const chats = () => {
    visibility = !visibility
    if(visibility){
        document.querySelector('.main__right').style.display = 'flex'
    }else{
        document.querySelector('.main__right').style.display = 'none'
    }
}

// emojies

const insert = (emojie) =>{
    document.querySelector('#chatMessage').value += emojie;
}


//messages handler

document.querySelector('#chatMessage').addEventListener('input',()=>{
    const author = document.querySelector('#UserName').value;

    if(author!==''&& author!==0)
    socket.emit('typing',author);

})

socket.on('typing',author=>{
    document.querySelector('#typerEvent').innerHTML 
    = ` <i style="color:white;"><span style="text-align:justify;text-transform: uppercase;font-size: 15px;color: rgb(155 255 137);">${author}</span> is typing...</i>`; 
})

document.querySelector('form').addEventListener('submit',(e)=>{
    e.preventDefault();
    const sender = document.querySelector('#UserName').value;
    const message = document.querySelector('#chatMessage').value;

    document.querySelector('#chatMessage').value = '';

    if(sender === '' || message === '' ){
        return document.querySelector('#error').textContent = 'Must Enter a name and a message ';
    }else{
        socket.emit('message',{sender,message});
        document.querySelector('#error').textContent = '';
    }
});

socket.on('message',data=>{
    
    document.querySelector('#typerEvent').innerHTML = ''
    //audio handler
    const sender = document.querySelector('#UserName').value;
    const player = document.querySelector('#messageAudio')

    if(sender!== data.sender){
        player.pause();
        player.currentTime = 0;
        player.play();
    }

    //new message handler
    const messageContainer = document.querySelector('ul')
    const newMessage = document.createElement('li');
    const message = `<p>
    <span style="text-align:justify;text-transform: uppercase;font-size: 15px;color: rgb(155 255 137);">${data.sender} </span>
     ${data.message} </i></p>`

     // delete button <i class="fa fa-trash" aria-hidden="true" style="float:right;">
    newMessage.innerHTML = message;
    messageContainer.append(newMessage);

    // scroller handler
    const messageWindow = document.querySelector('.main__chat_window')
    messageWindow.scrollTop = messageWindow.scrollHeight;
})

