import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "Hello. What are you seeking for?"; // Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const data = await req.json(); // Parse the JSON body of the incoming request
  console.log('API Key:', process.env.OPENROUTER_API_KEY);
  console.log('Test Variable:', process.env.TEST_VARIABLE);
  // Make a POST request to the OpenRouter API for the LLaMA model
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // Replace with your actual API key
      
      //"HTTP-Referer": `${process.env.YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings
      //"X-Title": `${process.env.YOUR_SITE_NAME}`, // Optional, shows in rankings on openrouter.ai
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "model": "meta-llama/llama-3.1-8b-instruct:free", // Specify the LLaMA model
      "messages": [
        { "role": "system", "content": systemPrompt }, // Include the system prompt
        ...data, // Include the user messages
      ],
    }),
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        const reader = response.body.getReader(); // Get the reader for the response stream
        let done, value;

        // Iterate over the streamed chunks of the response
        while (!done) {
          ({ done, value } = await reader.read()); // Read the next chunk
          if (value) {
            controller.enqueue(value); // Enqueue the received chunk to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
