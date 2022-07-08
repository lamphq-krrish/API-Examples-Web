import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './AgoraCall.css';
import socket from './socket';
import { getRole, getUid } from './utils';
import { MdScreenShare, MdStopScreenShare, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd  } from "react-icons/md";


const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });

function AgoraCall() {
  const uid = getUid();
  const role = getRole();
  const [ appid, setAppid ] = useState('63250937b95542478cb8d683cb5c3573');
  const [ token, setToken ] = useState('00663250937b95542478cb8d683cb5c3573IABlEBdj8mWzRE3aZoUsAwSg1K5DQCNHDehW0emnxru4NgZa8+gAAAAAEADLkLYodYfIYgEAAQB1h8hi');
  const [ channel, setChannel ] = useState('testing');
  const [pinnedUID, setPinnedUID] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true); 
  const [screenSharing, setScreenSharing] = useState(false);
  
  const publish = true;//pinnedUID == uid;

  console.log('Publish value', publish);

  const {
    localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers, publishScreenTrack, unPublishLocalVideoTrack, rePublishLocalVideoTrack
  } = useAgora(client, publish);

  useEffect(() => {
    socket.on('UPDATE_PINNED_UID', (uid) => {
      setPinnedUID(uid);
    })
  }, []);


  const getPinnedTracks = () => {
    if(pinnedUID) {
      const pinnedUser = remoteUsers.filter(u => u.uid == pinnedUID)[0];
      if(pinnedUser) {
        return {audio: pinnedUser.audioTrack, video: pinnedUser.videoTrack}
      }
    } 
    return {audio: undefined, video: localVideoTrack};
  }

  const toggleVideo = () => {
    if (!publish) return;
    localVideoTrack?.setEnabled(!localVideoTrack.enabled);
  }

  const toggleAudio = () => {
    if (!publish) return;
    localAudioTrack?.setEnabled(!localAudioTrack.enabled);
  }

  const startScreenShare = () => {
    unPublishLocalVideoTrack();
    publishScreenTrack();
  }

  const getPublisherControls = () => {
      return <>
         {micActive && <MdMicOff className='control-button bg-red' /> || <MdMic className='control-button bg-grey' />}
         {cameraActive &&  <MdVideocamOff className='control-button bg-red' /> ||  <MdVideocam className='control-button bg-grey' />}
         {screenSharing && <MdScreenShare className='control-button bg-red' /> || <MdStopScreenShare className='control-button bg-grey' />}
      </>
    }

  const ControlButtons = () => {
    return (
      <div className='control-buttons-wrapper'>
        {publish && getPublisherControls()}
        <MdCallEnd className='control-button bg-red' />
      </div>
    );
  }

  if (!joinState) {
   return <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState} onClick={() => {join(appid, channel, token, uid)}}>Join</button>
  }

  const pinnedTracks = getPinnedTracks();

  if (!pinnedTracks.video) {
    return (
      <div className='loading-container'>Loading...</div>
    );    
  }

  return (
    <div className="main-container">
      <MediaPlayer audioTrack={pinnedTracks.audio} videoTrack={pinnedTracks.video} style={{ height: "100vh"}} />
      <ControlButtons />
    </div>
  );
}


export default AgoraCall;
