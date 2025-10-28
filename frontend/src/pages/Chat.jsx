import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

const Chat = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Initialize socket - connect to backend on port 5001
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.emit('join_room', courseId);
    
    // Listen for messages from server (excluding our own messages)
    newSocket.on('receive_message', (data) => {
      console.log('Received message from Socket:', data);
      setMessages(prev => {
        // Skip if this is our own message (we already added it optimistically)
        if (data.sender === user?._id || data.senderName === user?.name) {
          console.log('Skipping own message to avoid duplicate');
          return prev;
        }
        
        // Create a unique key for this message
        const messageKey = `${data.text}-${data.timestamp}-${data.senderName}`;
        
        // Check if we already have this exact message
        const exists = prev.some(msg => {
          const prevKey = `${msg.text}-${msg.timestamp}-${msg.senderName}`;
          return messageKey === prevKey;
        });
        
        if (exists) {
          console.log('Duplicate message detected, skipping:', messageKey);
          return prev;
        }
        
        console.log('Adding new message from others:', messageKey);
        return [...prev, data];
      });
    });

    return () => {
      newSocket.close();
    };
  }, [courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/chat/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageText = newMessage;
    const timestamp = new Date().toISOString();
    
    const messageData = {
      courseId,
      text: messageText,
      sender: user._id,
      senderName: user.name,
      timestamp: timestamp
    };

    // Add message to local state first (optimistic update)
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg.text === messageText && msg.timestamp === timestamp);
      return exists ? prev : [...prev, messageData];
    });
    setNewMessage(''); // Clear input immediately

    // Send via Socket.io for real-time (broadcasts to others in room)
    socket.emit('send_message', messageData);

    // Also save to database for persistence
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/chat/course/${courseId}/message`, { text: messageText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  return (
    <div className="chat-container">
      <h2>Course Chat</h2>
      <p>Chat with students and instructor</p>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={`${msg.timestamp}-${index}`}
            className={`message ${msg.sender === user?._id || msg.senderName === user?.name ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <strong>{msg.senderName || msg.sender?.name}</strong>
              <span>{new Date(msg.timestamp).toLocaleString()}</span>
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="chat-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;

