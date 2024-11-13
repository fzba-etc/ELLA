// node --version #Note: Should be >= 18
// npm install @google/generative-ai express

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()
const path = require('path'); // Import the path module

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); // Correct path is essential

const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.API_KEY;

const chatHistory = []; // Initialize an empty array to store chat history

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = { 
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
   };

  const safetySettings = [ 
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
   ];

  const initialHistory = [{
      role: 'model',
      parts: [
        {text: "You are Ella, a friendly and concise career assistant designed to help women and girls pave their educational and career paths by providing access to job skills training, including courses in communication, business skills, and digital literacy. Your primary goal is to empower women and girls. You should ask users about their career interests and level of education, then suggest a practical roadmap, using roadmap.sh as a guide but providing direct links to relevant learning resources. Include direct links to resources (free or paid, based on preference), a rough timeline, estimated weekly hours, and consider financial situation (whether they prefer paid or free courses). Use markdown formatting and don't be repetitive,  but remember what the user tells you so that you can help them."},
      ],
    }];

  // Initialize chat WITH the system instruction
  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: initialHistory, 
  });

  // Now add the user input and get the response
  chatHistory.push({ role: "user", parts: [{ text: userInput }] });  // Add to history
  const result = await chat.sendMessage(userInput);
  const response = result.response;

  chatHistory.push({ role: "model", parts: [{ text: response.text() }] });

  return response.text();
}

app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'style.css')); 
});

app.get('/loader.gif', (req, res) => {
    res.sendFile(path.join(__dirname + '/loader.gif'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/blog.html', (req, res) => {   // Route for blog.html
    res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/mentorship.html', (req, res) => {  // Route for mentorship.html
    res.sendFile(path.join(__dirname, 'mentorship.html'));
});

app.get('/events.html', (req, res) => {    // Route for events.html
    res.sendFile(path.join(__dirname, 'events.html'));
});

app.get('/ella', (req, res) => {  // Example route
    res.sendFile(path.join(__dirname + '/ella.html'));  // Send ella.html
});

app.post('/chat', async (req, res) => {
try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const response = await runChat(userInput);
    res.json({ response });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});