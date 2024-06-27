// script.js
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

//% VARIABLES
let messages = [];

//? El símbolo de $ indica que es un elemento del DOM
const $ = el => document.querySelector(el); //! CREAMOS UN MÉTODO
const $form = $('form');
const $input = $('input');
const $template = $('#message-template');
const $messages = $('ul');
const $container = $('main');
const $button = $('button');
const $info = $('small');

const SELECTED_MODEL = 'Llama-3-8B-Instruct-q4f32_1-MLC-1k'; 
//¡gemma-2b-it-q4f32_1-MLC LOW MODEL
//!Llama-3-8B-Instruct-q4f32_1-MLC-1k BEST MODEL
const engine = await CreateMLCEngine(
    SELECTED_MODEL,
    {
        initProgressCallback: (info) => {
            console.log('initProgressCallback', info);
            $info.textContent = `${info.text}`;
            if (info.progress === 1) {
                $button.removeAttribute('disabled');
            }
        }
    }
);

const worker = new Worker('worker.js');

worker.onmessage = function (e) {
    const { type, data } = e.data;
    
    if (type === 'reply') {
        const $botMessage = document.querySelector('.bot:last-child .b');
        $botMessage.textContent += data;
        $container.scrollTop = $container.scrollHeight;
    } else if (type === 'complete') {
        $button.removeAttribute('disabled');
        messages.push({ role: 'assistant', content: data });
    }
};

$form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = $input.value.trim();
    if (messageText !== '') {
        $input.value = '';
        addMessage(messageText, 'user');
    }
    $button.setAttribute('disabled', true);

    const userMessage = { role: 'user', content: messageText };
    messages.push(userMessage);
    const $botMessage = addMessage("", 'bot'); // Añade un mensaje vacío para el bot

    const chunks = await engine.chat.completions.create({
        messages,
        stream: true
    });

    for await (const chunk of chunks) {
        const [choice] = chunk.choices;
        const content = choice?.delta?.content ?? "";
        worker.postMessage({ type: 'processChunk', data: content });
    }

    worker.postMessage({ type: 'complete' });
});

function addMessage(text, sender) {
    const clonedTemplate = $template.content.cloneNode(true);
    const $newMessage = clonedTemplate.querySelector('.message');
    const $who = $newMessage.querySelector('.a');
    const $text = $newMessage.querySelector('.b');
    $text.textContent = text;
    $who.textContent = sender === 'bot' ? 'Fénix' : 'Tú';
    $newMessage.classList.add(sender);
    $messages.appendChild($newMessage);
    $container.scrollTop = $container.scrollHeight;
    return $text;
}
