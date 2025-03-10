// Import required modules
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to encode image to base64
function encodeImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// Function to analyze image using OpenAI API
async function analyzeImage(imagePath, imageName) {
  try {
    console.log(`Analyzing image: ${imageName}`);
    console.log(`Full image path: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`File does not exist: ${imagePath}`);
      return {
        imageName,
        error: `File does not exist: ${imagePath}`
      };
    }
    
    // Encode image to base64
    let base64Image;
    try {
      base64Image = encodeImage(imagePath);
      console.log(`Successfully encoded image to base64`);
    } catch (encodeError) {
      console.error(`Error encoding image: ${encodeError.message}`);
      return {
        imageName,
        error: `Error encoding image: ${encodeError.message}`
      };
    }
    
    console.log(`Calling OpenAI API for image: ${imageName}`);
    
    // Call OpenAI API with gpt-4-vision-preview model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a design analyst specializing in website UI/UX and design implementation. Your task is to analyze the provided header design image for a press law (Presserecht) website. Focus on providing a detailed description of the header elements, layout, styles, colors and their exact positioning. Provide specific details about all UI components and how they should be implemented in HTML/CSS."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this header design for a Presserecht (press law) website. Provide an extremely detailed description of all visual elements, layout structure, styles, colors, and spacing. I need to implement this exact design in HTML/CSS. The image is named: ${imageName}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    });
    
    console.log(`Received response from OpenAI API for image: ${imageName}`);
    
    // Save to individual file
    const outputFileName = imageName.replace(/\.[^/.]+$/, "") + "-analysis.json";
    const outputPath = path.join(__dirname, outputFileName);
    
    fs.writeFileSync(outputPath, JSON.stringify({
      imageName,
      analysis: response.choices[0].message.content
    }, null, 2));
    
    console.log(`Analysis saved to ${outputPath}`);
    
    // Return the analysis
    return {
      imageName,
      analysis: response.choices[0].message.content
    };
  } catch (error) {
    console.error(`Error analyzing image ${imageName}:`, error);
    return {
      imageName,
      error: error.message
    };
  }
}

// Main function to analyze the header image
async function analyzeHeaderImage() {
  console.log('Starting header image analysis process');
  
  // Define path to the header image
  const imagePath = path.join(__dirname, '../screens/home/briefing_header.png');
  const imageName = 'briefing_header.png';
  
  try {
    const result = await analyzeImage(imagePath, imageName);
    console.log('Analysis complete');
    console.log(result.analysis);
  } catch (error) {
    console.error('Error in analysis process:', error);
  }
}

// Run the main function
analyzeHeaderImage().catch(error => {
  console.error('Error in main process:', error);
});
