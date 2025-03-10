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
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a design analyst specializing in website UI/UX and data structure identification. Analyze the provided image in detail, focusing on visual elements, layout, color scheme, typography, and potential data structures for a website about press law (Presserecht). Identify UI components like headers, navigation, content areas, and footers. For any text content, suggest appropriate data structures that would be needed for a WordPress implementation."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this website design image for a Presserecht (press law) website. Identify all visual elements, layout structure, and suggest data structures for WordPress implementation. The image is named: ${imageName}`
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
      max_tokens: 1000
    });
    
    console.log(`Received response from OpenAI API for image: ${imageName}`);
    
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

// Main function to process all images
async function processImages() {
  console.log('Starting image analysis process');
  
  // Define directories to scan
  const directories = [
    '../screens/home',
    '../screens/Frankfurter Medienrechtstage'
  ];
  
  const results = [];
  
  // Process each directory
  for (const dir of directories) {
    console.log(`Processing directory: ${dir}`);
    
    try {
      // Check if directory exists
      if (!fs.existsSync(dir)) {
        console.error(`Directory does not exist: ${dir}`);
        continue;
      }
      
      const files = fs.readdirSync(dir);
      console.log(`Found ${files.length} files in directory: ${dir}`);
      
      // Process each image file
      for (const file of files) {
        if (file.endsWith('.jpg') || file.endsWith('.png')) {
          console.log(`Processing file: ${file}`);
          const imagePath = path.join(dir, file);
          const result = await analyzeImage(imagePath, file);
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Error processing directory ${dir}:`, error);
    }
  }
  
  // Save results to JSON file
  const outputPath = path.join(__dirname, 'image-analysis-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Analysis complete. Results saved to ${outputPath}`);
}

// Run the main function
processImages().catch(error => {
  console.error('Error in main process:', error);
});
