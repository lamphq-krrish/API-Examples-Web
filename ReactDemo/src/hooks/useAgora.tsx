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
      resumeLocalTracks: Function,
      pauseLocalTracks: Function,
      rePublishLocalVideoTrack: Function,
      unPublishLocalVideoTrack: Function,
      muteLocalAudio: Function,
      unmuteLocalAudio: Function,
      pauseLocalVideo: Function,
      resumeLocalVideo: Function,
      unPublishScreenTrack: Function,
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
    
    await client.join(appid, channel, token || null, uid);

    if (publish){
      const [microphoneTrack, cameraTrack] = await createLocalTracks();
      await client.publish([microphoneTrack, cameraTrack]);
      (window as any).videoTrack = cameraTrack;
    }
   
    (window as any).client = client;


    setJoinState(true);
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

  function muteLocalAudio() {
    localAudioTrack?.setEnabled(false);
  }

  function unmuteLocalAudio() {
    localAudioTrack?.setEnabled(true);
  }

  function pauseLocalVideo() {
    localVideoTrack?.setEnabled(false);
  }

  function resumeLocalVideo() {
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

      if (screenTrack) {
        client.publish(screenTrack);
      } else {
        const screenShareTrack = await AgoraRTC.createScreenVideoTrack({encoderConfig: "1080p_1", optimizationMode: "detail"}, "disable" );
        setScreenTrack(screenShareTrack);
        client.publish(screenShareTrack);
      }      
  }

  async function unPublishScreenTrack() {
    client?.unpublish(screenTrack);
    return;
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
    resumeLocalTracks,
    pauseLocalTracks,
    unPublishLocalVideoTrack,
    rePublishLocalVideoTrack,
    muteLocalAudio,
    unmuteLocalAudio,
    pauseLocalVideo,
    resumeLocalVideo,
    unPublishScreenTrack,
  };
}