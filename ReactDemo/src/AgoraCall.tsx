import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './AgoraCall.css';
import socket from './socket';
import { getAppId, getRole, getRtcChannel, getRtcToken, getUid } from './utils';
import { MdScreenShare, MdStopScreenShare, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd  } from "react-icons/md";
import {BiClipboard} from "react-icons/bi";
import {FaUserCircle} from "react-icons/fa";


const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });

function AgoraCall() {
  const uid = getUid();
  const appId = getAppId();
  const token = getRtcToken();
  const channel = getRtcChannel();
  //const token = getRtcToken();
  // const role = getRole();
  // const [ appid, setAppid ] = useState('63250937b95542478cb8d683cb5c3573');
  //const [ token, setToken ] = useState('00663250937b95542478cb8d683cb5c3573IABlEBdj8mWzRE3aZoUsAwSg1K5DQCNHDehW0emnxru4NgZa8+gAAAAAEADLkLYodYfIYgEAAQB1h8hi');
  //const [ channel, setChannel ] = useState('testing');
  const [publisherUid, setPublisherUid] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true); 
  const [screenSharing, setScreenSharing] = useState(false);
  const [joining, setJoining] = useState(false);
  const publish = publisherUid == uid;
  const {
   localVideoTrack, leave, join, joinState, remoteUsers, publishScreenTrack, unPublishLocalVideoTrack, rePublishLocalVideoTrack, muteLocalAudio, unmuteLocalAudio,
    pauseLocalVideo, resumeLocalVideo, unPublishScreenTrack
  } = useAgora(client, publish);

  useEffect(() => {
    socket.on('UPDATE_PINNED_UID', (uid) => {
      setPublisherUid(uid);
    })
  }, []);


  const getPinnedTracks = () => {
    if(publisherUid) {
      const pinnedUser = remoteUsers.filter(u => u.uid == publisherUid)[0];
      if(pinnedUser) {
        return {audio: pinnedUser.audioTrack, video: pinnedUser.videoTrack}
      }
    } 
    return {audio: undefined, video: localVideoTrack};
  }

  const dropCall = () => {
    setJoining(false);
    leave();
  }

  const muteAudio = () => {
    muteLocalAudio();
    setMicActive(false);
  }

  const unmuteAudio = () =>  {
    unmuteLocalAudio();
    setMicActive(true);
  }

  const pauseVideo = () => {
    pauseLocalVideo();
    setCameraActive(false);
  }

  const resumeVideo = () => {
    resumeLocalVideo();
    setCameraActive(true);
  }

  const startScreenShare = () => {
    unPublishLocalVideoTrack();
    publishScreenTrack();
    setScreenSharing(true);
  }

  const stopScreenShare = () => {
    unPublishScreenTrack();
    rePublishLocalVideoTrack();
    setScreenSharing(false);
  } 

  const getPublisherControls = () => {
      return <>
         {micActive && <MdMic className='control-button bg-grey' onClick={muteAudio} /> || <MdMicOff className='control-button bg-red' onClick={unmuteAudio}/>}
         {cameraActive &&  <MdVideocam className='control-button bg-grey' onClick={pauseVideo}/> ||  <MdVideocamOff className='control-button bg-red' onClick={resumeVideo} />}
         {screenSharing && <MdStopScreenShare className='control-button bg-cyan ' onClick={stopScreenShare} /> || <MdScreenShare onClick={startScreenShare} className='control-button bg-grey' />}
         <BiClipboard className='control-button bg-grey' />
      </>
    }

  const ControlButtons = () => {
    return (
      <div className='control-buttons-wrapper'>
        {publish && getPublisherControls()}
        <MdCallEnd className='control-button bg-red' onClick={dropCall}/>
      </div>
    );
  }

  const pinnedTracks = getPinnedTracks();

  const VideoPlaceholder = ({title} : {title: string}) => {
    return (
      <div className='user-placeholder-controller'>
        <FaUserCircle className='user-placeholder' />
        <div>{title}</div>
      </div>
    );
  }

  const renderMainView = () => {
    if (publish && !cameraActive) {
      return <VideoPlaceholder title={uid || ''} />
    }
    if (pinnedTracks.video) {
      return <MediaPlayer audioTrack={pinnedTracks.audio} videoTrack={pinnedTracks.video} style={{ height: "100vh"}} />;
    }
    return <VideoPlaceholder title={publisherUid || ''} />
   
  }

  const joinCall = () => {
    setJoining(true);
    join(appId, channel, token, uid)
  }

  if (!joinState) {
    if(!joining) {
      return (
        <div className='join-screen-container'>
          <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState} onClick={joinCall}>Join</button>
        </div>
      );
    }
    return   <div className='join-screen-container'>Joining...</div>
  }

  return (
    <div className="main-container">
      {renderMainView()}
      <ControlButtons />
    </div>
  );
}


export default AgoraCall;
