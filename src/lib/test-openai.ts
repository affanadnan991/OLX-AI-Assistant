import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
// Simple parser for .env file
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at:', envPath);
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
            let value = match[2].trim();
            // Remove surrounding quotes if any
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            env[match[1].trim()] = value;
        }
    });
    return env;
}
async function testOpenAI() {
    const myEnv = loadEnv();
    const apiKey = myEnv.OPENAI_API_KEY;
    const apiBase = myEnv.OPENAI_API_BASE || 'https://api.openai.com/v1';
    console.log('Using API Base:', apiBase);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    if (apiKey) {
        console.log('API Key preview:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
    } else {
        console.error('OPENAI_API_KEY is not set in .env!');
        process.exit(1);
    }
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: apiBase
    });
    try {
        console.log('Attempting to list models...');
        const response = await openai.models.list();
        console.log('✅ Success! OpenAI API Key is valid and working.');
        console.log('Sample models available:', response.data.slice(0, 5).map(m => m.id));
    } catch (error: any) {
        console.error('❌ Error testing OpenAI API Key:');
        console.error(error.message || error);
        if (error.status === 401) {
            console.error('Error 401: Unauthorized. The API key is invalid or inactive.');
        }
    }
}
testOpenAI();
