import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { Pin, Trash2, Send } from 'lucide-react';
import './index.css';

// Generate or retrieve a persistent user ID from local storage
const getUserId = () => {
  let userId = localStorage.getItem('adverayze_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('adverayze_user_id', userId);
  }
  return userId;
};

const socket = io('http://localhost:4000');

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userId] = useState(getUserId());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial messages
    fetch('http://localhost:4000/api/messages')
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => console.error('Error fetching messages:', err));

    // Socket Event Listeners
    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('messageDeletedForMe', ({ messageId }) => {
      setMessages((prev) => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, deletedForUsers: [...(msg.deletedForUsers || []), userId] } 
            : msg
        )
      );
    });

    socket.on('messageDeletedForEveryone', ({ messageId }) => {
      setMessages((prev) => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeletedForEveryone: true } 
            : msg
        )
      );
    });

    socket.on('messagePinnedToggled', (updatedMsg) => {
      setMessages((prev) => 
        prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg)
      );
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageDeletedForMe');
      socket.off('messageDeletedForEveryone');
      socket.off('messagePinnedToggled');
    };
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    socket.emit('sendMessage', {
      content: inputValue,
      senderId: userId
    });
    setInputValue('');
  };

  const handleDeleteForMe = (messageId) => {
    socket.emit('deleteMessageForMe', { messageId, userId });
  };

  const handleDeleteForEveryone = (messageId) => {
    socket.emit('deleteMessageForEveryone', { messageId });
  };

  const handleTogglePin = (messageId) => {
    socket.emit('togglePinMessage', { messageId });
  };

  const pinnedMessages = messages.filter((msg) => 
    msg.isPinned && 
    !msg.isDeletedForEveryone && 
    !msg.deletedForUsers?.includes(userId)
  );

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>
          <div className="status-dot"></div>
          Adverayze Global Chat
        </h1>
        <div className="header-user-id">
          ID: Abhiram
        </div>
      </header>

      {pinnedMessages.length > 0 && (
        <div className="pinned-banner">
          {pinnedMessages.map((msg) => (
            <div key={`pin-${msg._id}`} className="pinned-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pin size={14} color="var(--pinned-border)" />
                {msg.content}
              </span>
              <button 
                className="action-btn"
                onClick={() => handleTogglePin(msg._id)}
                title="Unpin Message"
              >
                Unpin
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-messages">
        {messages.filter(msg => msg.senderId === userId).length === 0 ? (
          <div className="empty-state">No messages yet. Be the first to say hello!</div>
        ) : (
          messages.filter(msg => msg.senderId === userId).map((msg) => {
            const isSentByMe = msg.senderId === userId;
            const isDeletedForEveryone = msg.isDeletedForEveryone;
            const isDeletedForMe = msg.deletedForUsers?.includes(userId);

            return (
              <div 
                key={msg._id} 
                className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}
              >
                <div className={`message-bubble ${isDeletedForEveryone || isDeletedForMe ? 'message-deleted' : ''}`}>
                  {isDeletedForEveryone ? (
                    'This message is deleted for everyone'
                  ) : isDeletedForMe ? (
                    'This message is deleted for me'
                  ) : (
                    msg.content
                  )}
                </div>
                
                <div className="message-meta">
                  <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                  {msg.isPinned && !isDeletedForEveryone && !isDeletedForMe && <Pin size={12} color="var(--pinned-border)" />}
                </div>

                {(!isDeletedForEveryone && !isDeletedForMe) && (
                  <div className="message-actions">
                    <button 
                      className="action-btn pin" 
                      onClick={() => handleTogglePin(msg._id)}
                      title={msg.isPinned ? "Unpin" : "Pin message"}
                    >
                      <Pin size={14} />
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDeleteForMe(msg._id)}
                      title="Delete for me"
                    >
                      <Trash2 size={14} /> Me
                    </button>
                    {isSentByMe && (
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteForEveryone(msg._id)}
                        title="Delete for everyone"
                      >
                        <Trash2 size={14} /> Everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
            <Send size={18} style={{ marginRight: '8px' }} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
