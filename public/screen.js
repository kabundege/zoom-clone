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
    document.location.href = `https://rdaconnect.herokuapp.com/${RoomId}?sharescreen=false`; 
}

//////

document.addEventListener('DOMContentLoaded',()=>{
    if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
              }
            }
        ).then(stream => handlerPeer(stream));
      } else if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
              }
            }
        ).then(stream => handlerPeer(stream));
      } else {
        return navigator.mediaDevices.getUserMedia({
            video: {mediaSource: 'screen'},
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
              }
            }
        ).then(stream => handlerPeer(stream));
      }
})

//////////

const connetNewUser = (userId,stream) =>{
    const call = myPeer.call(userId,stream);

    const video = document.createElement('video');
    video.setAttribute('controls','true');

    call.on('stream',userStream=>{
        addVideo(video,userStream);
    })
    call.on('close',()=> {
        video.remove();
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


//messages handler

document.querySelector('#chatMessage').addEventListener('input',()=>{
    const author = document.querySelector('#UserName').value;

    if(author!==''&& author!==0){
        socket.emit('typing',author);
    }
})

setInterval(()=>document.querySelector('#typerEvent').textContent ='',3000)

socket.on('typing',author=>{
    document.querySelector('#typerEvent').innerHTML 
    = ` <span style="text-align:justify;text-transform: uppercase;font-size: 15px;color: rgb(155 255 137);">${author}</span> is typing...`; 
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
    //audio handler
    const sender = document.querySelector('#UserName').value;
    const player = document.querySelector('audio')

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
     ${data.message} </i></p>`;
     // delete button <i class="fa fa-trash" aria-hidden="true" style="float:right;">
    newMessage.innerHTML = message;
    messageContainer.append(newMessage);

    // scroller handler
    const messageWindow = document.querySelector('.main__chat_window')
    messageWindow.scrollTop = messageWindow.scrollHeight;
})

