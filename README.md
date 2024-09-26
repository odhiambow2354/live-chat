# Chat Application

This is a real-time chat application built using React.js for the frontend and Firebase for the backend. The application supports text and image messaging, and includes an offensive content detection system integrated with Hugging Face's API.

## Features

- **Real-time Messaging**: Users can send and receive messages in real-time.
- **Content Analysis**: Before a message is sent, its content is analyzed using a Hugging Face API to detect any offensive or hateful language. If such content is detected, the message is not sent, and the user receives a warning.
- **Image Messaging**: Users can also send images. The application checks the file size and ensures it's below 2MB before uploading.
- **Mobile Responsive**: The application is responsive and works well on both desktop and mobile devices.

## Folder Structure

src/
   
   ├── components/ # Reusable UI components (e.g., ChatBox, ChatUser)

   ├── config/ # Firebase configuration

   ├── context/ # App-wide state management using React Context API

   ├── lib/ # Helper functions (e.g., file upload utilities)

   ├── pages/ # Pages and main application views

## Content Analysis Integration

The application uses a Hugging Face API to check the content of each message before it is sent. The analysis determines whether the message is hateful or offensive. If the analysis returns a negative result (e.g., "Hateful" or "Offensive"), the message is blocked, and the user is notified with a warning toast.

[View the Content Analysis API on Hugging Face](https://huggingface.co/spaces/dairyproductseshop/gradio-hate-Analyzer)

## Live Demo

Check out the live version of the application:

[Live Chat Application](https://livechat-wheat.vercel.app/)

## How to Run Locally

1. Clone the repository:
   git clone git@github.com:odhiambow2354/live-chat.git

   cd chat-app

2. Install dependencies:
   npm install

3. Add Firebase configuration in `src/config/Firebase.js`.

4. Start the development server:
   npm start or
   npm run dev

5. Open your browser at `http://localhost:5173` to view the app.
