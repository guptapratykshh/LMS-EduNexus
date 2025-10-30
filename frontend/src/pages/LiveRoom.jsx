import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export default function LiveRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [participants, setParticipants] = useState({}); // userId -> name
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peersRef = useRef({});
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const displayStreamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.post(`/api/live/${sessionId}/join`, {}, { headers: { Authorization: `Bearer ${token}` }});
        setRoomCode(data.roomCode);
        setStatus(data.status);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const socket = getSocket();
        socketRef.current = socket;
        socket.emit('live:join', { roomCode: data.roomCode, userId: user._id, name: user.name });

        socket.on('live:status', ({ status: s }) => setStatus(s));

        socket.on('live:peer:join', ({ userId, name }) => {
          if (userId === user._id) return;
          setParticipants(prev => ({ ...prev, [userId]: name || 'Participant' }));
          createOfferForPeer(userId);
        });

        socket.on('live:signal', async ({ to, from, data }) => {
          if (to && to !== user._id) return;
          let pc = peersRef.current[from];
          if (!pc) pc = await createPeer(from);
          if (data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            if (data.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('live:signal', { roomCode: roomCode || data.roomCode, to: from, from: user._id, data: { sdp: pc.localDescription } });
            }
          } else if (data.candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
          }
        });

        socket.on('live:peer:leave', ({ userId: peerId }) => {
          detachRemote(peerId);
          const pc = peersRef.current[peerId];
          if (pc) pc.close();
          delete peersRef.current[peerId];
          setParticipants(prev => { const n = { ...prev }; delete n[peerId]; return n; });
        });
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    })();

    return () => {
      const socket = socketRef.current;
      if (socket && roomCode) socket.emit('live:leave', { roomCode, userId: user?._id });
      Object.values(peersRef.current).forEach(pc => pc.close());
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [sessionId]);

  async function createPeer(peerUserId) {
    const pc = new RTCPeerConnection(rtcConfig);
    peersRef.current[peerUserId] = pc;
    localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('live:signal', { roomCode, to: peerUserId, from: user._id, data: { candidate: e.candidate } });
      }
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      attachRemote(peerUserId, stream);
    };
    return pc;
  }

  async function createOfferForPeer(peerUserId) {
    const pc = await createPeer(peerUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit('live:signal', { roomCode, to: peerUserId, from: user._id, data: { sdp: pc.localDescription } });
  }

  function attachRemote(peerUserId, stream) {
    if (!remoteVideosRef.current[peerUserId]) {
      remoteVideosRef.current[peerUserId] = document.createElement('video');
      remoteVideosRef.current[peerUserId].autoplay = true;
      remoteVideosRef.current[peerUserId].playsInline = true;
      const container = document.getElementById('remoteVideos');
      if (container) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '320px';
        wrapper.style.background = '#000';
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.bottom = '6px';
        label.style.left = '6px';
        label.style.padding = '2px 6px';
        label.style.background = 'rgba(0,0,0,0.6)';
        label.style.color = '#fff';
        label.style.fontSize = '12px';
        label.innerText = participants[peerUserId] || 'Participant';
        wrapper.appendChild(remoteVideosRef.current[peerUserId]);
        remoteVideosRef.current[peerUserId].style.width = '320px';
        wrapper.appendChild(label);
        wrapper.setAttribute('data-peer', peerUserId);
        container.appendChild(wrapper);
      }
    }
    remoteVideosRef.current[peerUserId].srcObject = stream;
  }

  function detachRemote(peerUserId) {
    const container = document.getElementById('remoteVideos');
    if (!container) return;
    const el = container.querySelector(`[data-peer="${peerUserId}"]`);
    if (el) container.removeChild(el);
    const vid = remoteVideosRef.current[peerUserId];
    if (vid && vid.srcObject) vid.srcObject.getTracks().forEach(t => t.stop());
    delete remoteVideosRef.current[peerUserId];
  }

  function toggleAudio() {
    if (!localStreamRef.current) return;
    const enabled = localStreamRef.current.getAudioTracks().some(t => t.enabled);
    localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = !enabled));
    setIsMuted(enabled);
  }

  function toggleVideo() {
    if (!localStreamRef.current) return;
    const enabled = localStreamRef.current.getVideoTracks().some(t => t.enabled);
    localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = !enabled));
    setIsVideoOff(enabled);
  }

  async function startShare() {
    if (isSharing) return;
    try {
      const ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      displayStreamRef.current = ds;
      setIsSharing(true);
      // Replace outgoing video track
      const screenTrack = ds.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => stopShare();
    } catch (e) {
      // user cancelled
    }
  }

  function stopShare() {
    if (!isSharing) return;
    const ds = displayStreamRef.current;
    if (ds) ds.getTracks().forEach(t => t.stop());
    displayStreamRef.current = null;
    setIsSharing(false);
    // restore camera track
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
    }
  }

  async function endSession() {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/live/${sessionId}/status`, { status: 'ended' }, { headers: { Authorization: `Bearer ${token}` }});
      navigate(-1);
    } catch {}
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Live Class</h2>
        <div style={{ color: '#666', fontWeight: 600 }}>Participants: {Object.keys(participants).length + 1}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
          alignItems: 'stretch',
          background: 'linear-gradient(180deg, #f8fafc, #eef2f7)',
          padding: 12,
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ position: 'relative', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: 220, objectFit: 'cover', background: '#000' }} />
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
            {user?.name || 'Me'} (You)
          </div>
        </div>
        <div id="remoteVideos" style={{ display: 'contents' }} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 16,
          padding: 10,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
        }}
      >
        <button className="btn btn-secondary" onClick={toggleAudio}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button className="btn btn-secondary" onClick={toggleVideo}>{isVideoOff ? 'Start Video' : 'Stop Video'}</button>
        {!isSharing ? (
          <button className="btn btn-secondary" onClick={startShare}>Share Screen</button>
        ) : (
          <button className="btn btn-secondary" onClick={stopShare}>Stop Share</button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-danger" onClick={() => navigate(-1)}>Leave</button>
        {user?.role === 'instructor' && (
          <button className="btn btn-danger" onClick={endSession}>End Session</button>
        )}
      </div>

      <div style={{ marginTop: 12, color: status === 'error' ? '#b91c1c' : '#374151' }}>Status: {status}</div>
    </div>
  );
}


