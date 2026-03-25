const dotenv = require('dotenv');
const { Mistral } = require('@mistralai/mistralai');
const Groq = require('groq-sdk').default;

dotenv.config();

async function testProviders() {
  console.log('🧪 Testing AI Providers...\n');

  // Test Mistral
  console.log('1️⃣ Testing Mistral...');
  try {
    const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const result = await mistral.chat.complete({
      model: 'open-mistral-7b',
      messages: [
        { role: 'user', content: 'Say "Mistral works!" in JSON format with a key "message".' }
      ],
      maxTokens: 50,
      responseFormat: { type: 'json_object' }
    });
    console.log('✅ Mistral SUCCESS:', result.choices[0].message.content);
  } catch (error) {
    console.log('❌ Mistral FAILED:', error.message);
  }

  console.log('');

  // Test Groq
  console.log('2️⃣ Testing Groq...');
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: 'Say "Groq works!" in JSON format with a key "message".' }
      ],
      max_tokens: 50,
      response_format: { type: 'json_object' }
    });
    console.log('✅ Groq SUCCESS:', result.choices[0].message.content);
  } catch (error) {
    console.log('❌ Groq FAILED:', error.message);
  }

  console.log('\n✅ Test complete!');
}

testProviders().catch(console.error);
