import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './AgoraCall.css';
import { getAppId, getRole, getRtcChannel, getRtcToken, getUid } from './utils';
import { MdScreenShare, MdStopScreenShare, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd  } from "react-icons/md";
import {BiClipboard} from "react-icons/bi";
import {FaUserCircle} from "react-icons/fa";


const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });

const ROLE = {
  instructor: 'instructor',
  learner: 'learner',
}

function AgoraCall() {
  const uid = getUid();
  const appId = getAppId();
  const token = getRtcToken();
  const channel = getRtcChannel();
  const role = getRole();

  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true); 
  const [screenSharing, setScreenSharing] = useState(false);
  const [joining, setJoining] = useState(false);

  const publish = role === ROLE.instructor;
  
  const {
    leave, join, joinState, remoteUsers, publishScreenTrack, unPublishLocalVideoTrack, rePublishLocalVideoTrack, muteLocalAudio, unmuteLocalAudio,
    pauseLocalVideo, resumeLocalVideo, unPublishScreenTrack, localVideoTrack
  } = useAgora(client, publish);

  const getPinnedTracks = () => {
    if(publish){
      return {audio: undefined, video: localVideoTrack};
    }
    const remoteTracks = remoteUsers[0];
    if(!remoteTracks) {
      return null;
    }
    return {audio: remoteTracks.audioTrack, video: remoteTracks.videoTrack};
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

  const startScreenShare = async () => {
    unPublishLocalVideoTrack();
    try{
      await publishScreenTrack(() => {
        stopScreenShare();
      });
      setScreenSharing(true);
    }catch(err) {
      rePublishLocalVideoTrack();
      console.error(err);
      window.alert('Unable to share screen, check your settings');
    }
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

  const VideoPlaceholder = ({title} : {title: string}) => {
    return (
      <div className='user-placeholder-wrapper'>
        <FaUserCircle className='user-placeholder' />
        <div>{title}</div>
      </div>
    );
  }

  const WaitingScreen = () => {
    return (
      <div className='host-placeholder-wrapper'>
       <span>Waiting for host</span>
      </div>
    );
  }

  const renderMainView = () => {
  
    if (publish && !cameraActive) {
      return <VideoPlaceholder title={'You are host...'} />
    }

    const pinnedTracks = getPinnedTracks();

    if (!pinnedTracks) {
      return <WaitingScreen />
    }

    if (pinnedTracks.video) {
      return <MediaPlayer audioTrack={pinnedTracks.audio} videoTrack={pinnedTracks.video} style={{ height: "100vh"}} />;
    }
    return <VideoPlaceholder title={'Host...'} />
   
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
