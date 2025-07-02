import React, { useState, useEffect } from 'react';

const PerryAssistant = ({ currentStep, selectedPackage, selectedAddons, clientInfo }) => {
  const [isVisible, setIsVisible] = useState(true); // Always visible for testing
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('🎯 Perry Assistant mounted, isVisible:', isVisible);
    console.log('🎯 Current step:', currentStep);
    console.log('🎯 Perry should be visible now!');
  }, [isVisible, currentStep]);

  // Force Perry to be visible immediately
  useEffect(() => {
    setIsVisible(true);
    console.log('🎯 Perry set to visible immediately');
    
    // Add a welcome message after a short delay
    setTimeout(() => {
      addPerryMessage("Hi! I'm Perry, your photography concierge! 👋 How can I help you today?");
    }, 1000);
  }, []);

  const addPerryMessage = (message) => {
    setMessages(prev => [...prev, { type: 'perry', content: message, timestamp: new Date() }]);
  };

  const addUserMessage = (message) => {
    setMessages(prev => [...prev, { type: 'user', content: message, timestamp: new Date() }]);
  };

  const handleUserMessage = (message) => {
    addUserMessage(message);
    setUserInput('');
    
    // Perry's smart responses
    setTimeout(() => {
      const response = getPerryResponse(message.toLowerCase());
      addPerryMessage(response);
    }, 1000);
  };

  const getPerryResponse = (message) => {
    // FAQ routing
    if (message.includes('cancel') || message.includes('reschedule') || message.includes('policy')) {
      return "Smart to check that! Our complete policies are detailed at peridotimages.mypixieset.com/faqs/ - covers cancellations, rescheduling, weather contingencies, everything you'd want to know!";
    }
    
    if (message.includes('wear') || message.includes('outfit') || message.includes('prepare')) {
      return "Perfect question! Our comprehensive style guide at peridotimages.mypixieset.com/faqs/ covers outfits, colors, hair, makeup - like having a personal stylist guide you!";
    }
    
    if (message.includes('photos') || message.includes('delivery') || message.includes('when')) {
      return "Great question! Image delivery timing, formats, and our gallery system are all explained at peridotimages.mypixieset.com/faqs/ - you'll get the complete timeline there!";
    }

    // Package help
    if (message.includes('difference') || message.includes('package') || message.includes('compare')) {
      return "Happy to explain! Basic (15 photos) is perfect for minimalists. Premium (30+ photos) captures your family's story completely. Most families with 2+ people find Premium hits the sweet spot. What's your family size?";
    }

    // Email routing for complex questions
    if (message.includes('special needs') || message.includes('custom') || message.includes('specific')) {
      return "That sounds like it deserves personalized attention! For specialized requests, imagesbyperidot@gmail.com can work out all the details to make this perfect for your situation.";
    }

    // Default helpful response
    return "That's a great question! For detailed info, check our FAQ at peridotimages.mypixieset.com/faqs/ or reach out to imagesbyperidot@gmail.com for personalized help. What else can I clarify about our packages?";
  };

  const quickActions = [
    "What's the difference between packages?",
    "What should I wear?",
    "When will I get photos?",
    "Contact the team"
  ];

  // Always render Perry for testing
  console.log('🎯 Perry rendering, isVisible:', isVisible);

  return (
    <div className="perry-assistant" style={{ display: 'block', zIndex: 9999 }}>
      {!isOpen ? (
        <div 
          className="perry-bubble perry-pulse"
          onClick={() => {
            console.log('🎯 Perry bubble clicked');
            setIsOpen(true);
          }}
          title="Chat with Perry"
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            zIndex: 9999,
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.6)',
            border: '4px solid white',
            fontSize: '2.5rem',
            animation: 'perryPulse 2s infinite'
          }}
        >
          <span className="perry-bubble-icon">💬</span>
        </div>
      ) : (
        <div className="perry-chat-panel">
          <div className="perry-header">
            <div className="perry-title">Perry - Photography Concierge</div>
            <button 
              className="perry-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="perry-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`perry-message ${msg.type}`}>
                {msg.content}
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="perry-message perry">
                Hi! I'm Perry, your photography concierge. I can help explain packages, answer questions, or direct you to the right resources. What would you like to know? 📸
              </div>
            )}
            
            <div className="perry-quick-actions">
              {quickActions.map((action, index) => (
                <button 
                  key={index}
                  className="perry-quick-btn"
                  onClick={() => handleUserMessage(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
          
          <div className="perry-input-area">
            <input
              type="text"
              className="perry-input"
              placeholder="Ask me anything..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && handleUserMessage(userInput)}
            />
            <button 
              className="perry-send"
              onClick={() => userInput.trim() && handleUserMessage(userInput)}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerryAssistant; 