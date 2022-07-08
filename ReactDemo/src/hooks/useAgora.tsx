import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, IAgoraRTCRemoteUser, MicrophoneAudioTrackInitConfig, CameraVideoTrackInitConfig, IMicrophoneAudioTrack, ICameraVideoTrack, ILocalVideoTrack, ILocalAudioTrack } from 'agora-rtc-sdk-ng';



export default function useAgora(client: IAgoraRTCClient | undefined, publish: boolean = true)
  :
   {
      localAudioTrack: ILocalAudioTrack | undefined,
      localVideoTrack: ILocalVideoTrack | undefined,
      joinState: boolean,
      leave: Function,
      join: Function,
      remoteUsers: IAgoraRTCRemoteUser[],
      publishScreenTrack: Function,
      stopScreenSharing: Function,
      publishLocalTracks: Function,
      resumeLocalTracks: Function,
      pauseLocalTracks: Function,
      rePublishLocalVideoTrack: Function,
      unPublishLocalVideoTrack: Function,
    }
    {
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>(undefined);
  const [screenTrack, setScreenTrack] = useState<any>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  async function createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig, videoConfig?: CameraVideoTrackInitConfig)
  : Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]> {
    const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(audioConfig, videoConfig);
    setLocalAudioTrack(microphoneTrack);
    setLocalVideoTrack(cameraTrack);
    return [microphoneTrack, cameraTrack];
  }

  async function join(appid: string, channel: string, token?: string, uid?: string | number | null) {
    if (!client) return;
    const [microphoneTrack, cameraTrack] = await createLocalTracks();
    await client.join(appid, channel, token || null, uid);
    await client.publish([microphoneTrack, cameraTrack]);

    (window as any).client = client;
    (window as any).videoTrack = cameraTrack;

    setJoinState(true);
  }

  async function publishLocalTracks() {
    if(!client || !publish) return;
    
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
  }

  function muteAudio() {
    localAudioTrack?.setEnabled(false);
  }

  function unmuteAudio() {
    localAudioTrack?.setEnabled(true);
  }

  function stopVideo() {
    localVideoTrack?.setEnabled(false);
  }

  function resumeVideo() {
    localVideoTrack?.setEnabled(true);
  }

  function pauseLocalTracks() {
    localVideoTrack?.setEnabled(false);
    localAudioTrack?.setEnabled(false);
  }

  function resumeLocalTracks() {
    localVideoTrack?.setEnabled(true);
    localAudioTrack?.setEnabled(true);
  }

  function unPublishLocalVideoTrack() {
    client?.unpublish(localVideoTrack);
    return;
  }

  function rePublishLocalVideoTrack() {
    
    client?.publish(localVideoTrack as ILocalVideoTrack);
    return;
  }

  async function publishScreenTrack() {
    if (!client || !publish) return;
    try {
      if (screenTrack) {
        client.publish(screenTrack);
      } else {
        const screenShareTrack = await AgoraRTC.createScreenVideoTrack({encoderConfig: "1080p_1", optimizationMode: "detail"}, "disable" );
        setScreenTrack(screenShareTrack);
        client.publish(screenShareTrack);
      }      
    }catch(err) {
      console.error(err);
      window.alert("Unable to share screen, check your settiings");
    }
    
  }

  async function stopScreenSharing(){
    screenTrack.stop();
    screenTrack.close();
  }

  useEffect(() => {
    if (!client) return;
    setRemoteUsers(client.remoteUsers);

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      // toggle rerender while state of remoteUsers changed.
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [client]);

  return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join,
    remoteUsers,
    publishScreenTrack,
    stopScreenSharing,
    publishLocalTracks,
    resumeLocalTracks,
    pauseLocalTracks,
    unPublishLocalVideoTrack,
    rePublishLocalVideoTrack
  };
}