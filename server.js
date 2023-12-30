const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { SpeechClient } = require('@google-cloud/speech');  // Importing the Speech-to-Text client
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const axios = require('axios');
const fetch = require('node-fetch');
require('dotenv').config();


process.env.GOOGLE_APPLICATION_CREDENTIALS = './my-service-account-key.json';
const OPENAI_API_KEY = process.env.OpenAI_Key;


/*ChatGPT API*/
async function getSummary(transcription) {
    console.log("getSummary function called with transcription length:", transcription.length);
    console.log(`Raw Transcription length: ${transcription.length}`);
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: "user",
                content: `Below, is a transcription of a buisness meeting - please generate a summary that follows the meeting.
                Summary Requirements:

                Short Background:
                Generate a concise, fluent text outlining the context and key points discussed during the meeting.
                
                Action Items:Provide the task, owner, and due date for each action item. Format: "the task, the task owner - due date." Omit any missing information.
                
                Short Summary:
                Develop a fluent text summarizing the full conversation, emphasizing essential details and outcomes.
                Please ensure the output is written in professional business English.
                
                The transription:
                \n\n${transcription}`
            }
        ],
        max_tokens: 1000  // Limit to 1000 tokens for the response
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log("Response from OpenAI:", JSON.stringify(responseData, null, 2));


    // Extract the assistant's response from the responseData
    const assistantResponse = responseData.choices && responseData.choices[0] && responseData.choices[0].message.content.trim();
    console.log("Assistant's Response:", assistantResponse);

    return assistantResponse;
}

/*End ChatGPT API*/


// Pointing to the FFmpeg executable
ffmpeg.setFfmpegPath('C:/Digital_Science_Project/ffmpeg/bin/ffmpeg.exe');

const app = express();
app.use(cors());
const storage = new Storage();
const bucket = storage.bucket('new_bucket_smart');
const speechClient = new SpeechClient();  // Setting up the Speech-to-Text client

const upload = multer({
    dest: 'uploads/'
});

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const videoFilePath = req.file.path;
    const audioFilePath = videoFilePath + '.wav';

    ffmpeg()
        .input(videoFilePath)
        .toFormat('wav')
        .on('error', (err) => {
            console.error("Error during FFmpeg conversion:", err);
            res.status(500).send('Failed to convert audio.');
        })
        .on('end', async () => {
            console.log("FFmpeg conversion completed");

            try {
                const [uploadedFile] = await bucket.upload(audioFilePath); 
                console.log("Uploaded to GCS bucket successfully");

                const gcsUri = `gs://${bucket.name}/${uploadedFile.name}`;
                const request = {
                    config: {
                        encoding: 'LINEAR16',
                        languageCode: 'en-US',
                    },
                    audio: {
                        uri: gcsUri,
                    },
                };

                const [operation] = await speechClient.longRunningRecognize(request);
                const [response] = await operation.promise();
                const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

                // Save the transcription to GCS
                const transcriptFileName = uploadedFile.name.replace('.wav', '.txt');
                const transcriptBlob = bucket.file(transcriptFileName);
                await transcriptBlob.save(transcription, { contentType: 'text/plain' });
                console.log(`Transcription saved to ${bucket.name}/${transcriptFileName}`);
                console.log(`Raw Transcription: ${transcription}`);
                await transcriptBlob.makePublic(); // Make the transcription public

                // Get the summary using OpenAI's GPT model
                const summary = await getSummary(transcription);

                // Save the summary to GCS
                const summaryFileName = uploadedFile.name.replace('.wav', '-summary.txt');
                const summaryBlob = bucket.file(summaryFileName);
                await summaryBlob.save(summary, { contentType: 'text/plain' });
                console.log(`Summary saved to ${bucket.name}/${summaryFileName}`);
                await summaryBlob.makePublic(); // Make the summary public

                res.status(200).json({
                    success: true,
                    transcriptionLink: `https://storage.googleapis.com/${bucket.name}/${transcriptFileName}`,
                    summaryLink: `https://storage.googleapis.com/${bucket.name}/${summaryFileName}`
                });

            } catch (error) {
                console.error('Error processing the file:', error);
                res.status(500).send('Failed to process the file.');
            }
        })
        .save(audioFilePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});