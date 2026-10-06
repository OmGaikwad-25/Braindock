import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDpZBBSki1xG3QrtCgxe0evShVahdqboro');

async function checkModels() {
  try {
    const rawResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDpZBBSki1xG3QrtCgxe0evShVahdqboro`);
    const data = await rawResponse.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERROR listing models:', err.message);
  }
}

checkModels();
